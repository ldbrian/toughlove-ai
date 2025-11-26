import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-time-dummy-key'
);

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'dummy-key',
  baseURL: 'https://api.deepseek.com',
});

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { userId, language = 'zh' } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // 1. 先看有没有现成的“老底”
    const { data: memories } = await supabase
      .from('memories')
      .select('type, content')
      .eq('user_id', userId)
      .in('type', ['tag', 'fact']);

    let tags = memories?.filter(m => m.type === 'tag').map(m => m.content) || [];
    const facts = memories?.filter(m => m.type === 'fact').map(m => m.content) || [];

    // 2. 现场分析 (如果标签不足)
    if (tags.length === 0) {
        const { count } = await supabase
            .from('chat_histories')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        
        const chatCount = count || 0;
        const THRESHOLD = 10; 

        if (chatCount < THRESHOLD) {
            const remaining = THRESHOLD - chatCount;
            return NextResponse.json({
                tags: [], 
                diagnosis: language === 'zh' 
                    ? `⚠️ 样本严重不足。AI 无法进行有效侧写。\n\n请再进行 ${remaining} 次有效对话，以解锁您的精神档案。`
                    : `⚠️ Insufficient Data.\n\nPlease chat ${remaining} more times to unlock your Mental Profile.`
            });
        }

        // 聊够了，现场分析
        const { data: recentChats } = await supabase
            .from('chat_histories')
            .select('role, content')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(30); 

        if (recentChats && recentChats.length > 0) {
            const chatText = recentChats.reverse().map(c => `${c.role}: ${c.content}`).join('\n');
            
            // 🔥 强化 Prompt：强制中文
            const analyzePrompt = language === 'zh'
                ? `你是一个专业的心理侧写师。根据这段对话提取用户特征。
                   1. 提取3-5个简短的用户标签（如 #熬夜党 #恋爱脑）。
                   2. 写一句50字内的毒舌诊断。
                   ⚠️ 严格约束：所有内容【必须使用中文】输出。
                   JSON格式：{"tags": ["#中文标签"], "diagnosis": "中文诊断内容"}`
                : `Extract 3-5 tags and a short roast diagnosis. JSON: {"tags": [], "diagnosis": ""}`;

            try {
                const aiRes = await openai.chat.completions.create({
                    model: 'deepseek-chat',
                    messages: [{ role: 'system', content: analyzePrompt }, { role: 'user', content: chatText }],
                    response_format: { type: "json_object" }
                });
                const result = JSON.parse(aiRes.choices[0].message.content || '{}');
                
                if (result.tags && result.tags.length > 0) {
                    tags = result.tags;
                    const tagRows = tags.map((t: string) => ({
                        user_id: userId, type: 'tag', content: t, importance: 3
                    }));
                    await supabase.from('memories').insert(tagRows);
                }
                
                return NextResponse.json({
                    tags: tags.slice(0, 8),
                    diagnosis: result.diagnosis || (language === 'zh' ? "数据分析中..." : "Analyzing...")
                });

            } catch (err) {
                console.error("[Profile] Live Analyze Error:", err);
                return NextResponse.json({ tags: [], diagnosis: "Analysis Error" });
            }
        }
    }

    // 3. 老用户生成诊断
    let diagnosis = "";
    if (tags.length > 0 || facts.length > 0) {
        const summary = `Tags: ${tags.join(', ')}. Facts: ${facts.join('; ')}`;
        
        // 🔥 强化 Prompt：强制中文
        const diagPrompt = language === 'zh'
          ? `你是ToughLove的主治医师。根据用户标签写一段【毒舌、一针见血】的诊断书。
             字数控制在50字以内。
             ⚠️ 严格约束：【必须使用中文】回答，不要出现英文。`
          : `Write a short, brutal diagnosis based on these tags. <50 words.`;
        
        try {
            const diagRes = await openai.chat.completions.create({
                model: 'deepseek-chat',
                messages: [{ role: 'system', content: diagPrompt }, { role: 'user', content: summary }]
            });
            diagnosis = diagRes.choices[0].message.content || "";
        } catch (e) {
            console.error("[Profile] Diagnosis Error:", e);
        }
    }

    return NextResponse.json({
      tags: tags.slice(0, 8),
      diagnosis: diagnosis || (language === 'zh' ? "数据分析中..." : "Analyzing...")
    });

  } catch (error) {
    console.error('[Profile] Server Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}