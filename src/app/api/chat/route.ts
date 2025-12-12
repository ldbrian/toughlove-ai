import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { PERSONAS_REGISTRY } from '@/config/personas';
import { processRollingMemory } from '@/lib/memory';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'dummy',
  baseURL: 'https://api.deepseek.com',
  timeout: 9000, 
});

const FALLBACK_RESPONSES: Record<string, string[]> = {
    ash: ["Connection unstable. Retrying.", "Signal weak. Rebooting.", "I can't hear you clearly.", "Network error."],
    rin: ["The stars are quiet... signal lost.", "Can't hear you...", "Connection fuzzy.", "Try again?"],
    sol: ["Lagging! Speak up!", "Connection frozen!", "Hey! Signal is dead!", "Reconnecting..."],
    vee: ["Lag! Lag!", "Server crashed.", "Glitching out. BRB.", "404 Signal Not Found."],
    echo: ["Signal lost...", "Silence...", "Re-establishing link.", "Connection failed."]
};

async function getPersonaState(userId: string, personaId: string) {
    try {
        const { data } = await supabase.from('persona_states').select('mood, favorability, buff_end_at').eq('user_id', userId).eq('persona', personaId).single();
        let mood = data?.mood || 60;
        const bond = data?.favorability || 0;
        const isBuffed = data?.buff_end_at && new Date(data.buff_end_at) > new Date();
        return { mood, bond, isBuffed };
    } catch { return { mood: 60, bond: 0, isBuffed: false }; }
}

const getRelLevel = (bond: number) => {
    if (bond < 100) return "Stranger";
    if (bond < 300) return "Acquaintance";
    if (bond < 600) return "Friend";
    return "Soulmate";
};

const generatePersonaStyle = (persona: string, mood: number): string => {
    const p = persona.toLowerCase();
    if (p === 'ash') return mood < 30 ? "Cold, one word answers." : "Analytical, sarcastic.";
    if (p === 'rin') return mood < 30 ? "Sad, poetic, vague." : "Mysterious, teasing.";
    if (p === 'sol') return mood < 30 ? "Angry, protective." : "Loud, energetic!";
    if (p === 'vee') return mood < 30 ? "Bored, glitchy." : "Chaotic, internet slang.";
    if (p === 'echo') return "Quiet, observing, historical.";
    return "Natural conversation.";
};

export async function POST(req: Request) {
  let pKey = 'ash'; 

  try {
    const body = await req.json().catch(() => ({}));
    const { message, history, partnerId, userId = "user_01", envInfo } = body;

    if (!message) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    const requestedKey = partnerId?.toLowerCase();
    const foundKey = Object.keys(PERSONAS_REGISTRY).find(k => k.toLowerCase() === requestedKey);
    if (foundKey) pKey = foundKey;
    const config = PERSONAS_REGISTRY[pKey]; 

    // 1. 获取状态 (只读操作，并行没问题)
    const [stateResult, memoryResult] = await Promise.allSettled([
        getPersonaState(userId, pKey),
        (async () => {
            try {
                if (!userId) return "";
                const { data: topShards } = await supabase.from('memory_shards').select('content').eq('user_id', userId).order('created_at', { ascending: false }).limit(2);
                return topShards && topShards.length > 0 ? `[Memory]: ${topShards.map((s: any) => s.content).join(' | ')}` : "";
            } catch { return ""; }
        })()
    ]);

    const state = stateResult.status === 'fulfilled' ? stateResult.value : { mood: 60, bond: 0, isBuffed: false };
    const memoryContext = memoryResult.status === 'fulfilled' ? memoryResult.value : "";

    if (state.mood < 5 && !state.isBuffed && state.bond < 600) {
        return NextResponse.json({ reply: `[System] Connection Refused: ${config.name} is ignoring you.` });
    }

    const relLevel = getRelLevel(state.bond);
    const dynamicStyle = generatePersonaStyle(pKey, state.mood);

    const systemPrompt = `
${config.prompt}

[CONTEXT]
- Bond: ${relLevel} | Mood: ${state.mood}
- Time: ${envInfo?.time || 'Unknown'}
${memoryContext}

[STYLE GUIDE]
- Vibe: ${dynamicStyle}
- Rule: Speak like a real person in 2077. No robotic formats.
- Length: Short (under 50 words).
- Language: Use natural ${message.match(/[\u4e00-\u9fa5]/) ? 'Chinese' : 'English'}.
    `;

    // 2. 调用 AI 生成回复
    const completion = await openai.chat.completions.create({
        model: "deepseek-chat", 
        messages: [
            { role: "system", content: systemPrompt },
            ...(history || []).slice(-4), 
            { role: "user", content: message }
        ],
        temperature: 0.9, 
        max_tokens: 150,
    });
    const reply = completion.choices[0].message.content || "...";

    const currentConversationContext = [
        ...(history || []),
        { role: 'user', content: message },
        { role: 'assistant', content: reply }
    ];

    // 🔥🔥🔥 关键修复：第一步，必须先确保用户存在！🔥🔥🔥
    // 把这一步从 Promise.allSettled 里拿出来，变成同步等待
    // 只有这一步成功了，数据库里才有这个 userId，后面的 memory_shards 插入才不会报错
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        last_active: new Date().toISOString()
    }, { onConflict: 'id' });

    if (profileError) {
        // 如果这里报错，说明数据库连不上或者权限有问题，打印日志但尝试继续
        console.error("❌ Profile Update Failed:", profileError.message);
    }

    // 3. 第二步：用户户口解决了，现在可以放心地并行存聊天记录和生成碎片了
    const [saveRes, shardRes] = await Promise.allSettled([
        supabase.from('memories').insert({ 
            user_id: userId, content: message, type: 'chat', persona: pKey, metadata: { reply } 
        }),
        // 这时候再调用，因为上面已经 await 了 profile upsert，所以这里肯定安全
        processRollingMemory(userId, pKey, currentConversationContext)
    ]);

    // 4. 判断是否触发了碎片
    const fragmentTriggered = shardRes.status === 'fulfilled' && shardRes.value.triggered;

    return NextResponse.json({ 
        reply, 
        fragmentTriggered 
    });

  } catch (error: any) {
    console.error('Chat Crash:', error);
    const fallbacks = FALLBACK_RESPONSES[pKey] || FALLBACK_RESPONSES['ash'];
    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return NextResponse.json({ reply: `[⚠ WEAK SIGNAL] ${randomFallback}`, fragmentTriggered: false });
  }
}