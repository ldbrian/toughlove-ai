import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export async function POST(req: NextRequest) {
  try {
    const { userId, language = 'zh' } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // 1. 先去 memories 表捞现有的标签和事实
    const { data: memories } = await supabase
      .from('memories')
      .select('type, content')
      .eq('user_id', userId)
      .in('type', ['tag', 'fact']); // 只关心标签和事实

    let existingTags = memories?.filter(m => m.type === 'tag').map(m => m.content) || [];
    const existingFacts = memories?.filter(m => m.type === 'fact').map(m => m.content) || [];

    // 2. 如果标签太少（少于3个），说明是新用户或者记忆没触发
    // 我们现场去捞最近的聊天记录，补救一下
    if (existingTags.length < 3) {
      console.log("[Profile] Tags insufficient, analyzing recent chat...");
      const { data: recentChats } = await supabase
        .from('chat_histories')
        .select('role, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20); // 拿最近20句凑合分析一下

      if (recentChats && recentChats.length > 5) {
        // 现场分析
        const chatText = recentChats.map(c => `${c.role}: ${c.content}`).join('\n');
        const analyzePrompt = `
          分析这段对话，提取 3-5 个简短的用户标签（如：#熬夜党、#恋爱脑、#细节控）。
          只返回标签数组 JSON，如：{"tags": ["#标签1", "#标签2"]}
        `;
        
        const aiRes = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [{ role: 'system', content: analyzePrompt }, { role: 'user', content: chatText }],
            response_format: { type: "json_object" }
        });

        const newTags = JSON.parse(aiRes.choices[0].message.content || '{}').tags || [];
        
        // 把新标签存入 memories，以后就不用每次都分析了
        if (newTags.length > 0) {
            const tagRows = newTags.map((t: string) => ({
                user_id: userId,
                type: 'tag',
                content: t,
                importance: 3
            }));
            await supabase.from('memories').insert(tagRows);
            // 合并到显示列表
            existingTags = [...existingTags, ...newTags];
        }
      }
    }

    // 去重
    const finalTags = Array.from(new Set(existingTags));

    // 3. 生成“毒舌诊断书” (基于标签 + 事实)
    // 如果啥都没有，就给个默认的
    let diagnosis = language === 'zh' ? "样本数据不足，看起来像个无聊的普通人。" : "Insufficient data. Just a boring normie.";

    if (finalTags.length > 0 || existingFacts.length > 0) {
        const profileSummary = `用户标签：${finalTags.join(', ')}。\n已知事实：${existingFacts.join('; ')}`;
        
        const diagnosisPrompt = language === 'zh' 
          ? `你是 ToughLove 的主治医师。根据以下用户画像，写一段【简短、毒舌、一针见血】的精神状态诊断书。
             不要废话，直接给出结论。字数控制在 50 字以内。
             风格参考："重度恋爱脑，建议切除海马体。" 或 "熬夜成瘾，离猝死只差一个通宵。"`
          : `You are a toxic doctor at ToughLove. Based on this user profile, write a SHORT, ROASTING diagnosis.
             < 50 words. brutally honest.`;

        const diagRes = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [{ role: 'system', content: diagnosisPrompt }, { role: 'user', content: profileSummary }]
        });
        
        diagnosis = diagRes.choices[0].message.content || diagnosis;
    }

    return NextResponse.json({
      tags: finalTags.slice(0, 8), // 最多显示8个
      diagnosis: diagnosis
    });

  } catch (error) {
    console.error('[Profile] Error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}