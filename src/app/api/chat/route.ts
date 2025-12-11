import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { LOOT_TABLE } from '@/lib/constants';

// ✅ 架构升级：引入 IP 档案局
import { PERSONAS_REGISTRY } from '@/config/personas';
import { PersonaConfig } from '@/types'; 

// 初始化 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

// --- 0. 核心指令集 (The Soul) ---
const BASE_INSTRUCTION = `
[SYSTEM: STRICT ROLEPLAY]
1. You are NOT an AI. You are a character in Cyberpunk 2077.
2. **LENGTH LIMIT**: Max 40 words. Keep it extremely short.
3. **NO ACTIONS**: Do NOT write actions in parentheses like (looks at you). JUST SPEAK.
4. **NO NEWLINES**: Output must be a SINGLE line.
5. **HOOK**: Always end with a short question or provocation.
`;

// --- 1. 辅助逻辑：状态与环境计算 ---

async function getPersonaState(
    userId: string, 
    personaId: string, 
    config: PersonaConfig, 
    envInfo: any, 
    dailyEvent: any
) {
    let baseMood = 60; 
    let bond = 0; 
    let isBuffed = false; 

    try {
        const { data } = await supabase
            .from('persona_states')
            .select('mood, favorability, buff_end_at')
            .eq('user_id', userId)
            .eq('persona', personaId)
            .single();
        
        if (data) {
            baseMood = data.mood;
            bond = data.favorability;
            if (data.buff_end_at && new Date(data.buff_end_at) > new Date()) {
                isBuffed = true;
            }
        }
    } catch (e) {}

    if (dailyEvent && dailyEvent.moodImpact) baseMood += dailyEvent.moodImpact;
    
    const envMood = config.envImpact ? config.envImpact(envInfo) : 0;
    let finalMood = baseMood + envMood;
    
    if (isBuffed && finalMood < baseMood) finalMood = baseMood;
    
    finalMood = Math.max(0, Math.min(100, finalMood));

    return { mood: finalMood, bond, isBuffed };
}

const getRelLevel = (bond: number) => {
    if (bond < 100) return "Stranger";
    if (bond < 300) return "Acquaintance";
    if (bond < 600) return "Friend";
    return "Soulmate";
};

// 🔥 新增：专门的“碎片提炼师”
async function generateRefinedShard(userMsg: string, aiMsg: string) {
    try {
        const prompt = `
Task: Rewrite the essence of this dialogue into a "Memory Shard" (A short, poetic, third-person or second-person insight).
Context: Cyberpunk 2077.
User: "${userMsg}"
AI: "${aiMsg}"

Rules:
1. **EXTREMELY SHORT**: Max 20 Chinese characters (or 15 English words).
2. **NO Dialogue Tags**: Do not use "AI says" or quotes.
3. **Style**: Philosophic, Melancholic, or Sharp.
4. Output ONLY the text.

Example Input: "I want to die." -> "Logic error."
Example Output: 在绝望的逻辑尽头，数据依然渴望生存。
`;
        const completion = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7, 
            max_tokens: 60,
        });
        return completion.choices[0].message.content?.trim() || aiMsg; // 失败则回退到原句
    } catch (e) {
        console.error("Refine failed:", e);
        return aiMsg;
    }
}

// --- 2. 主处理流程 ---

export async function POST(req: Request) {
  try {
    const { message, history, partnerId, userId = "user_01", inventory = [], envInfo, dailyEvent } = await req.json();

    if (!message || !partnerId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    const pKey = Object.keys(PERSONAS_REGISTRY).find(k => k.toLowerCase() === partnerId.toLowerCase()) || 'ash';
    const config = PERSONAS_REGISTRY[pKey]; 

    // Step 1: 状态计算
    const state = await getPersonaState(userId, pKey, config, envInfo, dailyEvent);

    // Step 2: 情绪守门
    if (state.mood < 10 && !state.isBuffed && state.bond < 600) {
        let rejectText = "Connection Refused. [System: Low Tolerance]";
        if (pKey === 'ash') rejectText = "Don't waste my time. [System: Buy Coffee to unlock]";
        return NextResponse.json({ reply: rejectText });
    }

    // Step 3: 记忆回溯 (RAG)
    let memoryContext = "";
    try {
      if (userId) {
        // 只取最近的 2 条高权重碎片作为上下文，避免 Token 爆炸
        const { data: topShards } = await supabase
          .from('memory_shards')
          .select('content')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }) 
          .limit(2);

        if (topShards && topShards.length > 0) {
          memoryContext = `[User's Past Shadows]:\n${topShards.map((s: any) => `- ${s.content}`).join('\n')}`;
        }
      }
    } catch (e) { console.warn("RAG retrieval failed:", e); }

    // Step 4: 物品掉落 (GM)
    let lootInstruction = "";
    const availableLoot = Object.values(LOOT_TABLE).filter(item => 
      (item.sourcePersona === 'System' || item.sourcePersona === config.name) && 
      (!item.unique || !inventory.some((i: any) => i.id === item.id)) 
    );
    if (availableLoot.length > 0) {
        const lootListStr = availableLoot.map(item => `- ID: "${item.id}" | Trigger: ${item.trigger_context}`).join('\n');
        lootInstruction = `[LOOT CHECK]: Check user input vs triggers. Drop Rate 20%. If drop, append "{{icon:ITEM_ID}}".\n${lootListStr}`;
    }

    const isSecret = /秘密|别告诉|悄悄|保密/i.test(message);
    const privacyInstruction = isSecret ? `[SECRET DETECTED]: User is sharing a secret.` : ``;
    
    const relLevel = getRelLevel(state.bond);
    const moodTone = state.mood < 30 ? "Cold/Irritated" : (state.mood > 80 ? "Excited" : "Neutral");

    // 🔥 Step 6: 终极 Prompt (核弹级约束)
    const systemPrompt = `
${BASE_INSTRUCTION}

${config.prompt} 

[STATUS]
- Bond: ${relLevel}
- Mood: ${state.mood} (${moodTone})

[FRAGMENT TRIGGER - CRITICAL]
Analyze user's message for:
1. **Suicide/Death/Hopelessness** (e.g. "want to die", "no hope")
2. **Extreme Joy/Success** (e.g. "I did it", "happiest day")
3. **Deep Secrets**

IF MATCH: You MUST append " [FRAGMENT]" at the end.
IF NO MATCH: Do NOT append.

[EXAMPLE]
User: I want to die.
AI: Logic error. Your survival is required for my data collection. Why give up now? [FRAGMENT]
`;

    // Step 7: 生成 (超低温)
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(-6),
        { role: "user", content: message }
      ],
      temperature: 0.6, // 🔥 降到 0.6，强制听话
      max_tokens: 100,  // 🔥 强制短回复
    });

    let reply = completion.choices[0].message.content || "...";

    console.log("🤖 [AI RAW]:", reply);

    // 🔥 核心修改：双重保险触发逻辑
    let fragmentTriggered = false;
    
    // 1. AI 自主触发
    if (reply.includes('[FRAGMENT]')) {
        fragmentTriggered = true;
        reply = reply.replace(/\[FRAGMENT\]/g, '').trim();
    }
    
    // 2. 代码强制触发 (如果 AI 还是笨，代码来补救)
    const triggerKeywords = ['死', '不想活', '崩溃', '绝望', '痛苦', '再见', '开心', '太棒', '成功', 'debug_frag'];
    if (triggerKeywords.some(k => message.includes(k))) {
        console.log("⚠️ Code Override: Forcing Fragment Trigger based on keywords.");
        fragmentTriggered = true;
    }

    // 格式清洗：再次移除换行符
    reply = reply.replace(/(\r\n|\n|\r)/gm, " ");

    // Step 8: 异步存库 & 碎片生成
    (async () => {
        try {
            if (fragmentTriggered) {
                // 🔥 关键改动：调用提炼师，生成精炼内容
                const refinedContent = await generateRefinedShard(message, reply);
                console.log("✨ Refined Shard:", refinedContent);

                // 估算情绪标签
                let detectedEmotion = 'neutral';
                if (/死|痛|累|哭|怕|崩溃|绝望/.test(message)) detectedEmotion = 'anxiety';
                if (/笑|哈|爱|棒|爽|开心|成功/.test(message)) detectedEmotion = 'joy';
                if (/怒|滚|杀|恨/.test(message)) detectedEmotion = 'rage';

                await supabase.from('memory_shards').insert({
                    user_id: userId,
                    content: refinedContent, // 👈 存入提炼后的金句
                    type: 'insight',
                    emotion: detectedEmotion,
                    weight: 100, 
                    source_chat_id: null
                });
            }

            // 存入普通聊天记录 (这里还是存原始回复，保证聊天记录连贯)
            await supabase.from('memories').insert({
                user_id: userId,
                content: message,
                type: 'chat',
                persona: pKey,
                metadata: { reply, has_fragment: fragmentTriggered }
            });
        } catch(e) {
            console.error("Async save error:", e);
        }
    })();

    return NextResponse.json({ reply, fragmentTriggered });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'System Fail' }, { status: 500 });
  }
}