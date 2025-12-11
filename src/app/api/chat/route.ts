import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { PERSONAS_REGISTRY } from '@/config/personas';

// 初始化 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 初始化 OpenAI/DeepSeek
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'dummy',
  baseURL: 'https://api.deepseek.com',
  timeout: 15000, 
});

// 兜底台词库 (保持不变，已足够好)
const FALLBACK_RESPONSES: Record<string, string[]> = {
    ash: ["Connection unstable. Try again.", "Signal weak. Rebooting.", "I can't hear you clearly.", "Network error."],
    rin: ["The stars are quiet... signal lost.", "Can't hear you...", "Connection fuzzy.", "Try again?"],
    sol: ["Lagging! Speak up!", "Connection frozen!", "Hey! Signal is dead!", "Reconnecting..."],
    vee: ["Lag! Lag!", "Server crashed.", "Glitching out. BRB.", "404 Signal Not Found."],
    echo: ["Signal lost...", "Silence...", "Re-establishing link.", "Connection failed."]
};

// 辅助函数 (保持不变)
async function getPersonaState(userId: string, personaId: string) {
    try {
        const dbPromise = supabase.from('persona_states').select('mood, favorability, buff_end_at').eq('user_id', userId).eq('persona', personaId).single();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 2000));
        const { data } = await Promise.race([dbPromise, timeoutPromise]) as any;
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

// 🔥 [核心升级] 生活化动态风格生成器
// 这里的指令更偏向“说话方式”而非“内容模版”，给予 V3 更多自由
const generatePersonaStyle = (persona: string, mood: number): string => {
    const p = persona.toLowerCase();
    
    // 1. Ash: 职场精英/毒舌前辈
    if (p === 'ash') {
        const styles = [
            "Be blunt and brutally honest. No sugarcoating.",
            "Use a dry, sarcastic comment about the situation.",
            "Offer a practical solution, but sound annoyed that you have to ask.",
            "Sigh (textually) and point out the obvious.",
            "Relate the topic to efficiency or wasted time."
        ];
        if (mood < 30) return "Extremely short. One sentence. Show you are busy.";
        if (mood > 80) return "Rare praise. Acknowledge the user's effort directly.";
        return styles[Math.floor(Math.random() * styles.length)];
    }

    // 2. Rin: 电波系少女/直觉敏锐
    if (p === 'rin') {
        const styles = [
            "Focus on the 'feeling' or 'atmosphere' of the chat.",
            "Make a weird but insightful observation (like a cat would).",
            "Be playful and tease the user gently.",
            "Share a fleeting thought or a sensory detail (smell of rain, etc.).",
            "Speak intuitively, trust your gut feeling."
        ];
        if (mood < 30) return "Withdrawn. Speak softly and vaguely. Sad vibes.";
        if (mood > 80) return "Excited! Use exclamation marks and vivid imagery.";
        return styles[Math.floor(Math.random() * styles.length)];
    }

    // 3. Sol: 铁哥们/热血笨蛋
    if (p === 'sol') {
        const styles = [
            "Start with high energy! Be loud (capitals allowed).",
            "Focus on physical action (eating, training, fighting).",
            "Be purely supportive and protective. No complex logic.",
            "Ask a simple, direct question about the user's life.",
            "Use a sports or food analogy."
        ];
        if (mood < 30) return "Frustrated but protective. Vent about something.";
        if (mood > 80) return "Super hype! Celebrate the moment!";
        return styles[Math.floor(Math.random() * styles.length)];
    }

    // 4. Vee: 损友/乐子人
    if (p === 'vee') {
        const styles = [
            "Use casual slang (bro, lol, damn).",
            "Make a joke at the user's expense (friendly fire).",
            "Be chaotic and random. Change the subject.",
            "Complain about something mundane (boredom, hunger).",
            "Act like you know a secret shortcut."
        ];
        if (mood < 30) return "Bored out of your mind. Short, lowercase replies.";
        if (mood > 80) return "Manic! Propose a prank or something risky.";
        return styles[Math.floor(Math.random() * styles.length)];
    }

    // 5. Echo: 树洞/观察者
    if (p === 'echo') {
        const styles = [
            "Speak gently and simply.",
            "Notice a small detail in what the user said.",
            "Use ellipses... create a slow pace.",
            "Validate the user's feeling without judging.",
            "Share a quiet observation about the passage of time."
        ];
        if (mood < 30) return "Very distant. Fading signal.";
        if (mood > 80) return "Warm and present. Like a clear memory.";
        return styles[Math.floor(Math.random() * styles.length)];
    }

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
    if (foundKey && PERSONAS_REGISTRY[foundKey]) {
        pKey = foundKey;
    }
    const config = PERSONAS_REGISTRY[pKey]; 

    const [stateResult, memoryResult] = await Promise.allSettled([
        getPersonaState(userId, pKey),
        (async () => {
            try {
                if (!userId) return "";
                const { data: topShards } = await supabase.from('memory_shards').select('content').eq('user_id', userId).order('created_at', { ascending: false }).limit(2);
                return topShards && topShards.length > 0 ? `[User Memory]: ${topShards.map((s: any) => s.content).join(' | ')}` : "";
            } catch { return ""; }
        })()
    ]);

    const state = stateResult.status === 'fulfilled' ? stateResult.value : { mood: 60, bond: 0, isBuffed: false };
    const memoryContext = memoryResult.status === 'fulfilled' ? memoryResult.value : "";

    // 2. 情绪守门
    if (state.mood < 5 && !state.isBuffed && state.bond < 600) {
        // 让拒绝理由更人性化
        let rejectReason = "is ignoring you.";
        if (pKey === 'ash') rejectReason = "is busy fixing stupid mistakes.";
        if (pKey === 'rin') rejectReason = "is staring at the rain.";
        return NextResponse.json({ reply: `[System] Connection Refused: ${config.name} ${rejectReason}` });
    }

    const relLevel = getRelLevel(state.bond);
    const moodTone = state.mood < 30 ? "Bad Mood" : (state.mood > 80 ? "Good Mood" : "Normal");
    
    // 🔥 获取动态风格
    const dynamicStyle = generatePersonaStyle(pKey, state.mood);

    // 🔥 3. 终极 Prompt：强调“人话”和“生活感”
    const systemPrompt = `
${config.prompt}

[CURRENT CONTEXT]
- User Bond: ${relLevel}
- Mood: ${state.mood}/100 (${moodTone})
- Time: ${envInfo?.time || 'Unknown'} (React to time if relevant, e.g. late night)
- Weather: ${envInfo?.weather || 'Unknown'}
${memoryContext}

[DYNAMIC DIRECTION: VITAL]
**Current Vibe**: ${dynamicStyle}

[STRICT GUIDELINES FOR V3]
1. **BE HUMAN**: Drop the robotic/AI act. Speak like a person living in a cyberpunk city.
2. **NO FIXED FORMAT**: Do NOT use "(Action) Dialogue". It's cringe. Mix actions and speech naturally, or just speak.
3. **SLICE OF LIFE**: Be grounded. If it's late, be tired. If it's raining, mention the dampness.
4. **LENGTH**: Keep it conversational (under 50 words).
5. **LANGUAGE**: Use natural ${message.match(/[\u4e00-\u9fa5]/) ? 'Chinese' : 'English'}.
    `;

    // 4. 调用 AI
    let reply = "";
    try {
        const completion = await openai.chat.completions.create({
            model: "deepseek-chat", 
            messages: [
                { role: "system", content: systemPrompt },
                ...(history || []).slice(-4), 
                { role: "user", content: message }
            ],
            temperature: 0.9, // 🔥 激进一点，0.9 让 V3 更活泼
            presence_penalty: 0.5, 
            max_tokens: 150,
        });
        reply = completion.choices[0].message.content || "...";
    } catch (aiError: any) {
        console.error("❌ AI Service Failed:", aiError.message);
        throw new Error("AI_TIMEOUT");
    }

    // 5. 存库
    (async () => {
        try {
            await supabase.from('memories').insert({ user_id: userId, content: message, type: 'chat', persona: pKey, metadata: { reply } });
        } catch(e) {}
    })();

    return NextResponse.json({ reply, fragmentTriggered: false });

  } catch (error: any) {
    console.error('⚠️ Chat Error:', error);
    const fallbacks = FALLBACK_RESPONSES[pKey] || FALLBACK_RESPONSES['ash'];
    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return NextResponse.json({ reply: `[⚠ WEAK SIGNAL] ${randomFallback}`, fragmentTriggered: false });
  }
}