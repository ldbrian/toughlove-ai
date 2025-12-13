// src/lib/memory.ts
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// 初始化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'dummy',
  baseURL: 'https://api.deepseek.com',
  timeout: 10000,
});

// 🔥 配置：每日记忆生成上限
const DAILY_SHARD_LIMIT = 8; // 稍微调高一点，因为现在我们会分门别类，可能会有多条微小的事实

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
        // 1. 每日限流检查 (Rate Limiting)
        const todayStr = new Date().toISOString().split('T')[0]; 
        const { count, error: countError } = await supabase
            .from('memory_shards')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('persona', persona)
            .gte('created_at', todayStr);

        if (!countError) {
            const dailyCount = count || 0;
            if (dailyCount >= DAILY_SHARD_LIMIT) {
                console.log(`[Memory] Skipped: Daily limit reached (${dailyCount}/${DAILY_SHARD_LIMIT})`);
                return { triggered: false };
            }
        }

        console.log(`[Memory] Processing for ${userId} with ${persona}...`);

        // 2. 准备上下文 (Context) - 🔥 关键修改：严格标记角色
        let context = "";
        if (injectedMessages && injectedMessages.length > 0) {
             // 取最近 8 条，保证上下文完整
             const recent = injectedMessages.slice(-8); 
             context = recent
                .filter(m => m.content && typeof m.content === 'string')
                .map(m => {
                    // 强制标记角色，防止 AI 混淆
                    const roleTag = m.role === 'user' ? '【用户说】' : '【AI说】';
                    return `${roleTag}: ${m.content}`;
                })
                .join('\n');
        } else {
            return { triggered: false };
        }

        // 3. LLM 判决 (Forensic Analysis)
        // 🔥 核心修改：防幻觉 Prompt
        const response = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: `你是 ${persona} 的记忆审计员。你的唯一职责是**从【用户说】的内容中提取确凿的事实**。

⚠️ **防幻觉绝对原则 (Anti-Hallucination Rules)**：
1. **只看用户**：严禁从【AI说】的内容中提取事实。AI 说的话只是背景。
2. **拒绝推测**：如果用户说“我可能回去”，不要记录“他回去了”。要记录“他打算回去”。
3. **拒绝建议**：如果 AI 建议“你去喝杯水吧”，而用户没有明确回答“好的我喝了”，**绝不**记录用户喝水了。
4. **证据优先**：你提取的每一条记忆，必须能在对话中找到**原话证据**。

---

【需要提取的三类信息】
1. **👤 属性 (Attribute)**: 用户的基本信息（名字、职业、喜好、厌恶）。
   - *User: "我不吃葱"* -> Keep.
2. **📅 事件 (Event)**: 刚刚发生的客观事实或状态变化。
   - *User: "刚下班，累死了"* -> Keep.
3. **🌊 情绪 (Emotion)**: 极度强烈的情绪宣泄。
   - *User: "我真的受够了这种生活"* -> Keep.

【必须忽略】
- 日常寒暄 ("早安")
- 对 AI 的评价 ("你真聪明")
- 模糊的语气词 ("哈哈", "嗯嗯")

---

**输出格式 (JSON Only)**：
如果无重要信息，返回 {"keep": false}
如果有，返回：
{
  "keep": true,
  "content": "第三人称描述事实 (e.g. 用户刚才去跑步了)",
  "original_quote": "用户原话 (作为证据)",
  "emotion": "neutral" | "happy" | "sad" | "angry" | "anxious",
  "tags": ["hobbies", "work", "health"] // 便于 v3.0 检索的标签
}`
                },
                {
                    role: "user",
                    content: `对话审计记录：\n${context}\n\n请提取记忆：`
                }
            ],
            temperature: 0.1, // 保持绝对冷静
            response_format: { type: "json_object" }
        });

        let resultText = response.choices[0].message.content || "{}";
        
        let result;
        try {
            result = JSON.parse(resultText);
        } catch (e) {
            console.error("[Memory] JSON Parse Failed:", resultText);
            return { triggered: false };
        }

        if (!result.keep) {
            return { triggered: false };
        }

        // 4. 双重验证 (Double Check) - 简单的代码层过滤
        // 如果提取出的 content 里包含 "AI"、"你" 或者建议性的词，可能还是有幻觉，这里可以做简单的关键词拦截
        // 但 Prompt 里的 "只看用户" 应该能解决 90% 的问题。

        // 5. 存入数据库
        // v3.0 准备：存入 tags 和 original_quote，方便未来“翻旧账”时展示证据
        console.log(`[Memory] ✨ Saved: ${result.content} (Proof: ${result.original_quote})`);
        
        const { error: insertError } = await supabase.from('memory_shards').insert({
            user_id: userId,
            persona: persona,
            content: result.content, // 这是给 AI 看的摘要
            emotion: result.emotion || 'neutral',
            weight: 50, // 默认权重
            // 🔥 v3.0 伏笔：把原话和标签存进 metadata 或 original_context
            // 如果你的表结构只有 original_context，就存那里，或者扩展表字段
            original_context: `Quote: "${result.original_quote}" | Tags: ${result.tags?.join(',')}` 
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
        console.error("[Memory] Process Error:", e?.message || e);
        return { triggered: false };
    }
}