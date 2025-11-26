import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

// 初始化
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
    console.log(`[Profile DEBUG] Start analysis for User: ${userId}`);

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    // 1. 检查 memories
    const { data: memories, error: memError } = await supabase
      .from('memories')
      .select('type, content')
      .eq('user_id', userId)
      .in('type', ['tag', 'fact']);
    
    if (memError) console.error("[Profile DEBUG] Read memories failed:", memError);

    let tags = memories?.filter(m => m.type === 'tag').map(m => m.content) || [];
    console.log(`[Profile DEBUG] Existing tags count: ${tags.length}`);

    // 2. 强制现场分析 (移除 tags.length < 3 的限制，方便测试)
    // 查最近聊天记录
    const { data: recentChats, error: chatError } = await supabase
        .from('chat_histories')
        .select('role, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

    if (chatError) console.error("[Profile DEBUG] Read chat_histories failed:", chatError);
    
    console.log(`[Profile DEBUG] Recent chats found: ${recentChats?.length || 0}`);

    // 🔥 临时修改：只要有哪怕 1 条记录，就触发分析 (Threshold = 0)
    if (recentChats && recentChats.length > 0) {
        const chatText = recentChats.reverse().map(c => `${c.role}: ${c.content}`).join('\n');
        
        const analyzePrompt = `根据对话提取3-5个用户标签。JSON格式：{"tags": ["#tag1", "#tag2"], "diagnosis": "text"}`;

        try {
            console.log("[Profile DEBUG] Calling DeepSeek...");
            const aiRes = await openai.chat.completions.create({
                model: 'deepseek-chat',
                messages: [{ role: 'system', content: analyzePrompt }, { role: 'user', content: chatText }],
                response_format: { type: "json_object" }
            });
            
            const rawContent = aiRes.choices[0].message.content;
            console.log("[Profile DEBUG] DeepSeek Raw Response:", rawContent);

            const result = JSON.parse(rawContent || '{}');
            
            // 写入数据库逻辑
            if (result.tags && result.tags.length > 0) {
                const tagRows = result.tags.map((t: string) => ({
                    user_id: userId, 
                    type: 'tag', 
                    content: t, 
                    importance: 3
                }));
                
                console.log("[Profile DEBUG] Attempting to insert tags:", tagRows);

                // 🔥🔥🔥 关键点：带 await 的写入 🔥🔥🔥
                const { error: insertError } = await supabase.from('memories').insert(tagRows);
                
                if (insertError) {
                    console.error("❌ [Profile DEBUG] Insert FAILED:", insertError);
                } else {
                    console.log("✅ [Profile DEBUG] Insert SUCCESS!");
                }
                
                // 更新当前显示的 tags
                tags = [...tags, ...result.tags];
            } else {
                console.warn("[Profile DEBUG] AI returned no tags.");
            }

            // 返回结果
            return NextResponse.json({
                tags: tags.slice(0, 8),
                diagnosis: result.diagnosis || "Analysis Done."
            });

        } catch (err) {
            console.error("❌ [Profile DEBUG] AI Process Error:", err);
            return NextResponse.json({ tags: [], diagnosis: "AI Error" });
        }
    } else {
        // 连聊天记录都读不到？
        console.warn("[Profile DEBUG] No chat history found. Database might be empty or userId mismatch.");
        return NextResponse.json({ tags: [], diagnosis: "No Chat History Found" });
    }

  } catch (error) {
    console.error('❌ [Profile DEBUG] Fatal Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}