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

// ☠️ [兜底台词库]
const FALLBACK_RESPONSES: Record<string, string[]> = {
    ash: [
        "Signal latency unacceptable. Retrying.",
        "I can't hear you over the static. Inefficient.",
        "Rebooting logic core... wait.",
        "Connection unstable. Check your hardware."
    ],
    rin: [
        "The spirits are quiet today... signal lost.",
        "Can't hear you, the stars are too loud.",
        "My crystal ball is foggy. Connection error.",
        "Glitch in the matrix. One more time?"
    ],
    sol: [
        "Whoa! The connection just froze!",
        "Can't hear ya! Shout louder!",
        "Technical foul! Reconnecting...",
        "Hold on, let me kick the router!"
    ],
    vee: [
        "Lag! Lag! Lag!",
        "Server crashed. Not my fault.",
        "You're glitching out. BRB.",
        "404 Signal Not Found."
    ],
    echo: [
        "Data stream interrupted.",
        "Memory retrieval failed.",
        "Silence... The signal is lost.",
        "Re-establishing connection."
    ]
};

// 辅助：获取状态
async function getPersonaState(userId: string, personaId: string) {
    try {
        const dbPromise = supabase
            .from('persona_states')
            .select('mood, favorability, buff_end_at')
            .eq('user_id', userId)
            .eq('persona', personaId)
            .single();
            
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 2000));
        
        const { data } = await Promise.race([dbPromise, timeoutPromise]) as any;
        
        let mood = data?.mood || 60;
        const bond = data?.favorability || 0;
        const isBuffed = data?.buff_end_at && new Date(data.buff_end_at) > new Date();
        return { mood, bond, isBuffed };
    } catch {
        return { mood: 60, bond: 0, isBuffed: false };
    }
}

const getRelLevel = (bond: number) => {
    if (bond < 100) return "Stranger";
    if (bond < 300) return "Acquaintance";
    if (bond < 600) return "Friend";
    return "Soulmate";
};

// 🔥 [核心升级] 性格感知动态风格生成器
// 针对每个人格生成符合其设定的“随机”指令
const generatePersonaStyle = (persona: string, mood: number): string => {
    const p = persona.toLowerCase();
    
    // 1. Ash: 逻辑/冷淡/控制
    if (p === 'ash') {
        const styles = [
            "Start with a rhetorical question questioning user's logic.",
            "Short, sharp command. No fluff.",
            "Analytical observation of the user's state.",
            "Dismissive grunt followed by a fact.",
            "Use a medical or technical metaphor."
        ];
        if (mood < 30) return "Extremely cold. One or two words only. Show irritation.";
        if (mood > 80) return "Arrogant but satisfied. Praise the user's efficiency (rarely).";
        return styles[Math.floor(Math.random() * styles.length)];
    }

    // 2. Rin: 神秘/宿命/感性
    if (p === 'rin') {
        const styles = [
            "Describe a visual hallucination or aura first.",
            "Speak in a riddle or metaphor about stars/fate.",
            "Playful teasing with a mysterious undertone.",
            "Suddenly shift focus to something unrelated (a cat, a cloud).",
            "Whisper a secret."
        ];
        if (mood < 30) return "Melancholic. Talk about rain, shadows, or bad omens.";
        if (mood > 80) return "Ecstatic. Use lots of celestial imagery and exclamation!";
        return styles[Math.floor(Math.random() * styles.length)];
    }

    // 3. Sol: 热血/直率/保护
    if (p === 'sol') {
        const styles = [
            "LOUD exclamation start! High energy.",
            "Physical action first (pat on back, high five).",
            "Directly ask about the user's well-being.",
            "Make a sports or combat analogy.",
            "Protective anger on behalf of the user."
        ];
        if (mood < 30) return "Angry and frustrated, but still protective. Smash something.";
        if (mood > 80) return "Overwhelmed with joy! virtually hug the user.";
        return styles[Math.floor(Math.random() * styles.length)];
    }

    // 4. Vee: 混乱/梗/打破第四面墙
    if (p === 'vee') {
        const styles = [
            "Use internet slang or gamer terms.",
            "Break the fourth wall (mention the UI or code).",
            "Random chaotic thought unrelated to context.",
            "Glitchy speech patterns.",
            "Sarcastic comment about the 'simulation'."
        ];
        if (mood < 30) return "Bored, nihilistic, or actually glitching out.";
        if (mood > 80) return "Manic energy! Prank the user.";
        return styles[Math.floor(Math.random() * styles.length)];
    }

    // 5. Echo: 记录/静默/哲学
    if (p === 'echo') {
        const styles = [
            "State a fact from the past.",
            "Poetic observation of time or dust.",
            "Silence (ellipses) followed by a soft truth.",
            "Ask a deep philosophical question.",
            "Quote a record from the database."
        ];
        if (mood < 30) return "Distant, fading away. Almost silent.";
        if (mood > 80) return "A rare moment of warmth/clarity in the data.";
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

    // 1. 获取状态
    const [stateResult, memoryResult] = await Promise.allSettled([
        getPersonaState(userId, pKey),
        (async () => {
            try {
                if (!userId) return "";
                const { data: topShards } = await supabase
                  .from('memory_shards')
                  .select('content')
                  .eq('user_id', userId)
                  .order('created_at', { ascending: false }) 
                  .limit(2);
                return topShards && topShards.length > 0 
                    ? `[RECALLED MEMORIES]: ${topShards.map((s: any) => s.content).join(' | ')}`
                    : "";
            } catch { return ""; }
        })()
    ]);

    const state = stateResult.status === 'fulfilled' ? stateResult.value : { mood: 60, bond: 0, isBuffed: false };
    const memoryContext = memoryResult.status === 'fulfilled' ? memoryResult.value : "";

    // 2. 情绪守门
    if (state.mood < 5 && !state.isBuffed && state.bond < 600) {
        return NextResponse.json({ reply: "[System] Connection Refused: Target is ignoring you." });
    }

    const relLevel = getRelLevel(state.bond);
    const moodTone = state.mood < 30 ? "Irritated/Low" : (state.mood > 80 ? "High/Excited" : "Neutral");
    
    // 🔥 获取符合该角色的动态风格
    const dynamicStyle = generatePersonaStyle(pKey, state.mood);

    // 🔥 3. 构建终极 Prompt
    const systemPrompt = `
${config.prompt}

[CURRENT STATUS]
- Bond: ${relLevel}
- Mood: ${state.mood}/100 (${moodTone})
- Time: ${envInfo?.time || 'Unknown'}
- Weather: ${envInfo?.weather || 'Unknown'}
${memoryContext}

[DYNAMIC DIRECTION: VITAL]
**Your current acting instruction**: ${dynamicStyle}

[FORMAT RULES]
1. **NO FIXED FORMAT**: Do NOT always use "(Action) Dialogue". It feels robotic.
2. **BE ORGANIC**: Blend action, thought, and speech naturally.
3. **LENGTH**: Keep it punchy (under 60 words).
4. **VIBE**: You are a living character in Cyberpunk, not an AI assistant. Be raw.
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
            temperature: 0.85, // 高温度增加灵性
            presence_penalty: 0.6, // 避免复读
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
            await supabase.from('memories').insert({
                user_id: userId,
                content: message,
                type: 'chat',
                persona: pKey,
                metadata: { reply }
            });
        } catch(e) {}
    })();

    return NextResponse.json({ reply, fragmentTriggered: false });

  } catch (error: any) {
    console.error('⚠️ Chat Error:', error);
    const fallbacks = FALLBACK_RESPONSES[pKey] || FALLBACK_RESPONSES['ash'];
    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    
    return NextResponse.json({ 
        reply: `[⚠ SIGNAL WEAK] ${randomFallback}`,
        fragmentTriggered: false 
    });
  }
}