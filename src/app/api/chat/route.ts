import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
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
// 这些是所有角色都要遵守的底层物理定律
const BASE_INSTRUCTION = `
[Global System Instructions]
1. **Identity Lock**: You are NOT an AI. You are a living character in Cyberpunk 2077.
2. **NO FULL STOPS**: Do NOT end the conversation. Every reply must end with a **hook** (question, provocation, invitation, or challenge).
3. **Core Mission**: Make the user talk more. Dig into their desires, fears, and logic.
4. **Style**: Short, punchy, like a text message (< 60 words). No customer service tone.
`;

// --- 1. 辅助逻辑：状态与环境计算 ---

async function getPersonaState(
    userId: string, 
    personaId: string, 
    config: PersonaConfig, // 👈 传入配置对象，用于计算环境影响
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

    // 处理每日事件心情波动
    if (dailyEvent && dailyEvent.moodImpact) baseMood += dailyEvent.moodImpact;
    
    // ✅ 架构升级：调用 Config 内部的环境感知函数
    // 如果 config.envImpact 存在则调用，否则为 0
    const envMood = config.envImpact ? config.envImpact(envInfo) : 0;
    
    let finalMood = baseMood + envMood;
    
    // 如果处于 Buff 状态（比如喝了咖啡），心情不会跌破基础值
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

    // ✅ 架构升级：从注册表中查找配置
    // 兼容大小写：先转小写匹配 Key，找不到则默认 Ash
    const pKey = Object.keys(PERSONAS_REGISTRY).find(k => k.toLowerCase() === partnerId.toLowerCase()) || 'ash';
    const config = PERSONAS_REGISTRY[pKey]; // 获取该角色的完整档案

    // Step 1: 状态计算 (传入 config)
    const state = await getPersonaState(userId, pKey, config, envInfo, dailyEvent);

    // Step 2: 情绪守门
    if (state.mood < 10 && !state.isBuffed && state.bond < 600) {
        let rejectText = "(...Connection Refused...)";
        // 简单的硬编码 fallback，也可以考虑移入 config
        if (pKey === 'ash') rejectText = "(Ash 盯着屏幕看了一眼，直接切断了通讯。) \n\n[系统提示：目标耐受度过低，请前往商店获取【冰美式】]";
        if (pKey === 'sol') rejectText = "(Sol 的头像变成了灰色，自动回复：电量耗尽，休眠中... zZZ) \n\n[系统提示：请购买【高能电池】]";
        return NextResponse.json({ reply: rejectText });
    }

    // Step 3: 记忆回溯 (RAG)
    let memoryContext = "";
    try {
      if (userId) {
        const { data: topShards } = await supabase
          .from('memory_shards')
          .select('content')
          .eq('user_id', userId)
          .gt('weight', 75)
          .order('created_at', { ascending: false })
          .limit(2);

        if (topShards && topShards.length > 0) {
          memoryContext = `[User's Deep Memories]:\n${topShards.map((s: any) => `- ${s.content}`).join('\n')}\n(Use these to provoke the user)`;
        }
      }
    } catch (e) {
      console.warn("RAG retrieval failed:", e);
    }

    // Step 4: 物品掉落 (GM)
    let lootInstruction = "";
    const availableLoot = Object.values(LOOT_TABLE).filter(item => 
      (item.sourcePersona === 'System' || item.sourcePersona === config.name) && // 这里的 name 对应 Config 里的 name
      (!item.unique || !inventory.some((i: any) => i.id === item.id)) 
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

    // 🔥 Step 6: 终极 Prompt (IP 注入)
    // 直接读取 config.prompt，这里包含了最核心的 Gender 和 IP 设定
    const systemPrompt = `
${BASE_INSTRUCTION}

${config.prompt} 

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

    // Step 8: 异步存库 & 碎片生成
    (async () => {
        try {
            await generateShardIfWorthy(userId, pKey, message, reply);
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

// 碎片生成逻辑保持不变
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
      const { error: userError } = await supabase
        .from('users')
        .upsert(
            { device_id: userId, nickname: 'Traveler' }, 
            { onConflict: 'device_id' }
        );

      if (userError) console.error("User upsert failed:", userError);

      const { error: shardError } = await supabase.from('memory_shards').insert({
          user_id: userId,
          content: result.content,
          type: 'insight',
          emotion: result.emotion || 'neutral',
          weight: result.weight,
          source_chat_id: null
      });

      if (shardError) {
          console.error("Shard insert failed:", shardError);
      } else {
          revalidatePath('/mirror');
      }
    }
  } catch (e) {
    console.error("Shard gen warning:", e);
  }
}