import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

// 防崩兜底配置
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

    // 1. 先看有没有现成的“老底” (Memories)
    const { data: memories } = await supabase
      .from('memories')
      .select('type, content')
      .eq('user_id', userId)
      .in('type', ['tag', 'fact']);

    let tags = memories?.filter(m => m.type === 'tag').map(m => m.content) || [];
    const facts = memories?.filter(m => m.type === 'fact').map(m => m.content) || [];

    // 2. 如果没有现成标签，判断是否需要现场生成
    if (tags.length === 0) {
        // 查一下用户聊了多少句
        const { count } = await supabase
            .from('chat_histories')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        
        const chatCount = count || 0;
        const THRESHOLD = 10; // 门槛：10句

        // 🛑 情况 A：聊得太少，拒绝造假
        if (chatCount < THRESHOLD) {
            const remaining = THRESHOLD - chatCount;
            return NextResponse.json({
                tags: [], 
                diagnosis: language === 'zh' 
                    ? `⚠️ 样本严重不足。AI 无法进行有效侧写。\n\n请再进行 ${remaining} 次有效对话，以解锁您的精神档案。`
                    : `⚠️ Insufficient Data.\n\nPlease chat ${remaining} more times to unlock your Mental Profile.`
            });
        }

        // ✅ 情况 B：聊够了(>10句)，现场分析一次
        console.log(`[Profile] User ${userId} has ${chatCount} msgs. Analyzing...`);
        
        const { data: recentChats } = await supabase
            .from('chat_histories')
            .select('role, content')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(30); // 取最近30句

        if (recentChats && recentChats.length > 0) {
            const chatText = recentChats.reverse().map(c => `${c.role}: ${c.content}`).join('\n');
            
            const analyzePrompt = language === 'zh'
                ? `根据对话提取3-5个用户标签（如 #熬夜党 #恋爱脑），并写一句50字内的毒舌诊断。JSON格式：{"tags": ["#tag"], "diagnosis": "text"}`
                : `Extract 3-5 tags and a short roast diagnosis. JSON: {"tags": [], "diagnosis": ""}`;

            try {
                const aiRes = await openai.chat.completions.create({
                    model: 'deepseek-chat',
                    messages: [{ role: 'system', content: analyzePrompt }, { role: 'user', content: chatText }],
                    response_format: { type: "json_object" }
                });
                const result = JSON.parse(aiRes.choices[0].message.content || '{}');
                
                // 🔥🔥🔥 核心修复：必须加 await 确保写入完成 🔥🔥🔥
                if (result.tags && result.tags.length > 0) {
                    tags = result.tags;
                    const tagRows = tags.map((t: string) => ({
                        user_id: userId, 
                        type: 'tag', 
                        content: t, 
                        importance: 3
                    }));
                    
                    // 这里的 await 是关键！
                    const { error } = await supabase.from('memories').insert(tagRows);
                    if (error) console.error("[Profile] Memory insert failed:", error);
                    else console.log("[Profile] Memories saved successfully.");
                }
                
                // 直接返回现场生成的结果
                return NextResponse.json({
                    tags: tags.slice(0, 8),
                    diagnosis: result.diagnosis || (language === 'zh' ? "数据分析中..." : "Analyzing...")
                });

            } catch (err) {
                console.error("[Profile] Live Analyze Error:", err);
                // 出错也不要崩，返回空
                return NextResponse.json({ tags: [], diagnosis: "Analysis Error" });
            }
        }
    }

    // 3. 情况 C：有现成数据 (老用户)
    let diagnosis = "";
    if (tags.length > 0 || facts.length > 0) {
        const summary = `Tags: ${tags.join(', ')}. Facts: ${facts.join('; ')}`;
        const diagPrompt = language === 'zh'
          ? `你是ToughLove主治医师。根据用户画像写一段【毒舌、一针见血】的诊断书。50字以内。`
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