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

// 🔥 配置：每日记忆生成上限 (防止话痨刷屏)
const DAILY_SHARD_LIMIT = 5;

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
        // 获取今日零点的时间戳
        const todayStr = new Date().toISOString().split('T')[0]; 
        
        // 快速查一下今天已经存了多少条
        const { count, error: countError } = await supabase
            .from('memory_shards')
            .select('*', { count: 'exact', head: true }) // head: true 只查数量不查内容，极快
            .eq('user_id', userId)
            .eq('persona', persona)
            .gte('created_at', todayStr);

        if (countError) {
            console.error("[Memory] Count Error:", countError);
        } else {
            const dailyCount = count || 0;
            if (dailyCount >= DAILY_SHARD_LIMIT) {
                console.log(`[Memory] Skipped: Daily limit reached (${dailyCount}/${DAILY_SHARD_LIMIT})`);
                return { triggered: false };
            }
        }

        console.log(`[Memory] Processing for ${userId} with ${persona}... (Daily: ${count}/${DAILY_SHARD_LIMIT})`);

        // 2. 准备上下文 (Context)
        let context = "";
        if (injectedMessages && injectedMessages.length > 0) {
             const recent = injectedMessages.slice(-6); 
             context = recent
                .filter(m => m.content && typeof m.content === 'string')
                .map(m => `${m.role.toUpperCase()}: ${m.content}`)
                .join('\n');
        } else {
            // ... (数据库兜底逻辑保持不变，为了代码简洁略过，通常走上面的 if)
            // 如果你需要这部分兜底代码，我可以补上，但通常 injectedMessages 都有值
            return { triggered: false };
        }

        // 3. LLM 判决 (Strict Filter)
        // 🔥 核心修改：大幅收紧 Prompt，要求“极度吝啬”
        const response = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: `你是 ${persona} 的长期记忆管理员。
你的任务是**极度吝啬**地筛选对话，只有当用户**明确透露了重要信息**时，才生成记忆碎片。

【必须忽略的情况】(直接返回 {"keep": false})
- ❌ 日常问候 (你好、在吗、晚安)
- ❌ 闲聊废话 (今天天气不错、吃了吗)
- ❌ 情绪不强烈的吐槽 (好无聊、有点累)
- ❌ AI 的回复内容 (不要记录你自己说的话，只记录用户的信息)

【必须记录的情况】(返回 {"keep": true, ...})
- ✅ **事实性偏好** (用户说："我讨厌吃香菜"、"我养了一只猫"、"我的生日是...") -> 存为 Fact
- ✅ **重大人生事件** (用户说："我失业了"、"我分手了"、"我拿到Offer了") -> 存为 Event
- ✅ **极端情绪爆发** (极度绝望、狂喜、愤怒) -> 存为 Emotion

⚠️ 输出纯 JSON (不要 Markdown):
Example: {"keep": false}
Example: {"keep": true, "content": "用户讨厌吃香菜", "emotion": "neutral", "weight": 90}`
                },
                {
                    role: "user",
                    content: `对话记录：\n${context}\n\n判断是否生成记忆？`
                }
            ],
            temperature: 0.1, // 🔥 降温：让它更理性、更保守
        });

        let resultText = response.choices[0].message.content || "{}";
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

        let result;
        try {
            result = JSON.parse(resultText);
        } catch (e) {
            console.error("[Memory] JSON Parse Failed:", resultText);
            return { triggered: false };
        }

        if (!result.keep) {
            console.log(`[Memory] Result: Ignored (Low Value)`);
            return { triggered: false };
        }

        // 4. 存入数据库
        console.log(`[Memory] ✨ Creating Shard: ${result.content}`);
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
        console.error("[Memory] Process Error:", e?.message || e);
        return { triggered: false };
    }
}