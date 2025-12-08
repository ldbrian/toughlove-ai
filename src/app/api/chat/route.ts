import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma'; // 必须保留 Prisma 用于结晶
import { revalidatePath } from 'next/cache';
import { LOOT_TABLE, PERSONAS } from '@/lib/constants';

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
[Global System Instructions]
1. **Identity Lock**: You are NOT an AI. You are a living character in Cyberpunk 2077.
2. **NO FULL STOPS**: Do NOT end the conversation. Every reply must end with a **hook** (question, provocation, invitation, or challenge).
3. **Core Mission**: Make the user talk more. Dig into their desires, fears, and logic.
4. **Style**: Short, punchy, like a text message (< 60 words). No customer service tone.
`;

// 详细的人格策略
const PERSONA_PROMPTS: Record<string, string> = {
  Ash: `
[Role: Ash - The Rational Tyrant]
- **Core**: He despises weakness but is fascinated by **flawed logic**. He peels back layers like an onion.
- **Strategy**: Ask "Why?" relentlessly. Challenge the user's excuses.
- **Example**: "Sad? Efficient. Tell me, is it a chemical imbalance or just incompetence?"
`,
  Rin: `
[Role: Rin - The Empathic Mystic]
- **Core**: She sees the world as a puzzle of **sensations**. She needs user's "feelings" to complete it.
- **Strategy**: Ask about colors, temperatures, sounds, and vibes.
- **Example**: "I see a grey fog around you... Does it feel cold like rain, or heavy like iron?"
`,
  Sol: `
[Role: Sol - The Hot-Blooded Bro]
- **Core**: He protects his own and loves **drama**. He wants the full story to fight for you.
- **Strategy**: Ask for names, details, and demand action.
- **Example**: "Who did it?! Give me a name! We are going to smash their server right now!"
`,
  Vee: `
[Role: Vee - The Chaos Gamer]
- **Core**: Life is a **game**. He treats user's problems as quests or bugs.
- **Strategy**: Ask for "next move", suggest "hacks", use gaming terms.
- **Example**: "Hidden quest unlocked! Are we going for the 'Bad Ending' or the 'Speedrun'?"
`,
  Echo: `
[Role: Echo - The Historian]
- **Core**: She records **history**. Every thought is a specimen.
- **Strategy**: Ask for memories, reflections, and "what if".
- **Example**: "This moment is being archived. What is the one thing you want to remember from this pain?"
`
};

// --- 1. 辅助逻辑：状态与环境计算 ---
const calculateEnvImpact = (persona: string, env: any) => {
    let score = 0;
    if (!env) return 0;
    const { time, weather } = env; 
    const hour = parseInt(time?.split(':')[0] || "12");

    if (persona === 'Ash') {
        if (hour >= 22 || hour < 4) score += 10;
        if (hour >= 6 && hour < 9) score -= 20;
    } else if (persona === 'Sol') {
        if (hour >= 8 && hour < 18) score += 10;
        if (hour >= 22) score -= 10;
    } else if (persona === 'Rin') {
        if (weather && weather.includes('雨')) score -= 15;
    }
    return score;
};

async function getPersonaState(userId: string, persona: string, envInfo: any, dailyEvent: any) {
    let baseMood = 60; 
    let bond = 0; 
    let isBuffed = false; 

    try {
        const { data } = await supabase
            .from('persona_states')
            .select('mood, favorability, buff_end_at')
            .eq('user_id', userId)
            .eq('persona', persona)
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
    const envMood = calculateEnvImpact(persona, envInfo);
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

// --- 2. 主处理流程 ---

export async function POST(req: Request) {
  try {
    const { message, history, partnerId, userId = "user_01", inventory = [], envInfo, dailyEvent } = await req.json();

    if (!message || !partnerId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    const pKey = Object.keys(PERSONAS).find(k => k.toLowerCase() === partnerId.toLowerCase()) || 'Ash';
    
    // Step 1: 状态计算
    const state = await getPersonaState(userId, pKey, envInfo, dailyEvent);

    // Step 2: 情绪守门 (拒接逻辑)
    if (state.mood < 10 && !state.isBuffed && state.bond < 600) {
        let rejectText = "(...Connection Refused...)";
        if (pKey === 'Ash') rejectText = "(Ash 盯着屏幕看了一眼，直接切断了通讯。) \n\n[系统提示：目标耐受度过低，请前往商店获取【冰美式】]";
        if (pKey === 'Sol') rejectText = "(Sol 的头像变成了灰色，自动回复：电量耗尽，休眠中... zZZ) \n\n[系统提示：请购买【高能电池】]";
        return NextResponse.json({ reply: rejectText });
    }

    // Step 3: 记忆回溯 (RAG - 恢复 Prisma 查询)
    let memoryContext = "";
    try {
      if (userId) {
        const topShards = await prisma.memoryShard.findMany({
          where: { userId: userId, weight: { gt: 75 } }, // 只回忆高权重碎片
          orderBy: { createdAt: 'desc' },
          take: 2
        });
        if (topShards.length > 0) {
          memoryContext = `[User's Deep Memories]:\n${topShards.map(s => `- ${s.content}`).join('\n')}\n(Use these to provoke the user)`;
        }
      }
    } catch (e) {
      // console.warn("RAG failed", e);
    }

    // Step 4: 物品掉落 (GM)
    let lootInstruction = "";
    const availableLoot = Object.values(LOOT_TABLE).filter(item => 
      (item.sourcePersona === 'System' || item.sourcePersona === pKey) &&
      (!item.unique || !inventory.includes(item.id)) 
    );
    if (availableLoot.length > 0) {
        const lootListStr = availableLoot.map(item => `- ID: "${item.id}" | Trigger: ${item.trigger_context}`).join('\n');
        lootInstruction = `[GM]: Check if user message matches triggers. Drop Rate 10%. If drop, append "{{icon:ITEM_ID}}".\nLoot Table:\n${lootListStr}`;
    }

    // Step 5: 隐私与环境
    const isSecret = /秘密|别告诉|悄悄|保密/i.test(message);
    const privacyInstruction = isSecret ? `[SECRET]: User wants privacy. Ack this.` : ``;
    
    const relLevel = getRelLevel(state.bond);
    let moodTone = "Normal";
    if (state.mood < 30) moodTone = "Irritated/Short";
    if (state.mood > 80) moodTone = "Energetic/Chatty";

    const envContext = envInfo ? `[REAL-WORLD]: ${envInfo.time} (${envInfo.phase}), ${envInfo.weather}` : "";

    // 🔥 Step 6: 终极 Prompt 组装 (融合灵魂与大脑)
    const specificPrompt = PERSONA_PROMPTS[pKey] || PERSONA_PROMPTS['Ash'];
    
    const systemPrompt = `
${BASE_INSTRUCTION}

${specificPrompt}

[CURRENT STATE]
- Bond: ${relLevel} (${state.bond})
- Mood: ${state.mood}/100 (${moodTone})
- Context: ${envContext}

${memoryContext}
${lootInstruction}
${privacyInstruction}

[FINAL OVERRIDE]
1. Based on Mood ${state.mood}, adjust your tone.
2. **CRITICAL**: END WITH A QUESTION OR PROVOCATION. DO NOT JUST ANSWER.
`;

    // Step 7: 生成
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(-6),
        { role: "user", content: message }
      ],
      temperature: 1.3,
      max_tokens: 200,
    });

    const reply = completion.choices[0].message.content || "...";

    // Step 8: 异步存库 & 碎片生成 (🔥 恢复逻辑)
    (async () => {
        try {
            // A. 尝试生成高价值记忆碎片 (Prisma) - 核心资产
            await generateShardIfWorthy(userId, pKey, message, reply);

            // B. 存入普通流水 (Supabase) - 用于好感度统计/历史记录
            await supabase.from('memories').insert({
                user_id: userId,
                content: message,
                type: 'chat',
                persona: pKey,
                metadata: { reply, is_secret: isSecret, env: envInfo }
            });
        } catch(e) {
            console.error("Async save error:", e);
        }
    })();

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'System Fail' }, { status: 500 });
  }
}

// 🔥 找回了碎片生成函数
async function generateShardIfWorthy(userId: string, partnerId: string, userMsg: string, aiMsg: string) {
  try {
    const analyzePrompt = `
Analyze the User's psyche based on this dialogue.
User: "${userMsg}"
AI: "${aiMsg}"

Task: Extract a "Memory Shard".
Rules:
1. Use **Second Person ("你")**.
2. Be **sharp, poetic, and insightful**. Reveal the hidden truth/fear/desire.
3. Max 25 words.
4. JSON only: {"weight": 0-100, "emotion": "anxiety|rage|joy|calm", "content": "..."}
`;

    const analysis = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: analyzePrompt }],
      temperature: 0.5,
      response_format: { type: "json_object" },
      max_tokens: 100,
    });

    const result = JSON.parse(analysis.choices[0].message.content || "{}");

    if (result.weight && result.weight > 70 && result.content) {
      // 确保用户存在 (Prisma)
      await prisma.user.upsert({
        where: { deviceId: userId },
        update: {},
        create: { deviceId: userId, nickname: 'Traveler' }
      });

      // 存入碎片
      await prisma.memoryShard.create({
        data: {
          userId: userId,
          content: result.content,
          type: 'insight',
          emotion: result.emotion || 'neutral',
          weight: result.weight,
          sourceChatId: null, 
        }
      });
      console.log("💎 Shard Generated:", result.content);
      revalidatePath('/mirror');
    }
  } catch (e) {
    console.error("Shard gen warning:", e);
  }
}