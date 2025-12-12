import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'dummy',
  baseURL: 'https://api.deepseek.com',
  timeout: 10000,
});

export interface ShardResult {
    triggered: boolean;
    content?: string;
    emotion?: string;
}

export async function processRollingMemory(
    userId: string, 
    persona: string, 
    injectedMessages?: { role: string, content: string }[] 
): Promise<ShardResult> {
    try {
        console.log(`[Memory] Processing for ${userId} with ${persona}...`);

        let context = "";

        // 策略 A: 使用传入的实时对话 (High Priority)
        if (injectedMessages && injectedMessages.length > 0) {
             const recent = injectedMessages.slice(-6); // 取最近6条
             // 过滤掉非文本内容 (防御性编程)
             context = recent
                .filter(m => m.content && typeof m.content === 'string')
                .map(m => `${m.role.toUpperCase()}: ${m.content}`)
                .join('\n');
        } 
        // 策略 B: 查库兜底 (Fallback)
        else {
            const { data: recentChats, error } = await supabase
                .from('memories')
                .select('content, role, created_at')
                .eq('user_id', userId)
                .eq('persona', persona)
                .order('created_at', { ascending: false })
                .limit(6);

            if (error || !recentChats || recentChats.length < 2) {
                console.log(`[Memory] Skipped: Not enough DB history`);
                return { triggered: false };
            }
            context = recentChats.reverse().map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
        }

        // ⚠️ 关键修正：确保同时包含 System 和 User 消息
        const response = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: `你是 ${persona} 的潜意识记忆整理者。
任务：分析用户的对话，判断是否有值得铭记的"高光时刻"（强烈情绪、深度共鸣、重要约定）。

⚠️ 必须输出纯 JSON 格式，不要包含 Markdown 反引号：
Example: {"keep": false}
Example: {"keep": true, "content": "简短回忆文本(20字内)", "emotion": "joy", "weight": 80}`
                },
                {
                    // 🔥 把对话上下文放在 User 消息里，这样 API 才会正常工作
                    role: "user",
                    content: `以下是最近的对话记录：\n\n${context}\n\n请分析是否有生成记忆碎片的必要？`
                }
            ],
            temperature: 0.7,
            // 移除 response_format 以防万一
        });

        let resultText = response.choices[0].message.content || "{}";
        
        // 再次清洗，防止 ```json
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

        let result;
        try {
            result = JSON.parse(resultText);
        } catch (e) {
            console.error("[Memory] JSON Parse Failed:", resultText);
            return { triggered: false };
        }

        if (!result.keep) {
            console.log(`[Memory] Result: No significant memory.`);
            return { triggered: false };
        }

        console.log(`[Memory] ✨ Creating Shard: ${result.content}`);

        // 3. 存入 Memory Shards 表
        const { error: insertError } = await supabase.from('memory_shards').insert({
            user_id: userId,
            persona: persona,
            content: result.content,
            emotion: result.emotion || 'neutral',
            weight: result.weight || 50,
            original_context: context 
        });

        if (insertError) {
            console.error('[Memory] Insert Failed:', insertError);
        }

        return { 
            triggered: true, 
            content: result.content, 
            emotion: result.emotion 
        };

    } catch (e: any) {
        // 打印更详细的错误信息
        console.error("[Memory] Process Error:", e?.message || e);
        return { triggered: false };
    }
}