import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { PERSONAS_REGISTRY } from '@/config/personas';

// 初始化 Supabase (使用 Service Role 也就是管理员权限，确保能写入)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 初始化 OpenAI/DeepSeek
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'dummy',
  baseURL: 'https://api.deepseek.com',
  // 🔥 [超时保护] 9秒熔断，防止 Vercel 杀进程导致前端红屏
  timeout: 9000, 
});

// 兜底台词库 (故障时的剧场版回复)
const FALLBACK_RESPONSES: Record<string, string[]> = {
    ash: ["Connection unstable. Retrying.", "Signal weak. Rebooting.", "I can't hear you clearly.", "Network error."],
    rin: ["The stars are quiet... signal lost.", "Can't hear you...", "Connection fuzzy.", "Try again?"],
    sol: ["Lagging! Speak up!", "Connection frozen!", "Hey! Signal is dead!", "Reconnecting..."],
    vee: ["Lag! Lag!", "Server crashed.", "Glitching out. BRB.", "404 Signal Not Found."],
    echo: ["Signal lost...", "Silence...", "Re-establishing link.", "Connection failed."]
};

// 辅助：获取状态
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

// 动态风格生成器
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
                const { data: topShards } = await supabase.from('memory_shards').select('content').eq('user_id', userId).order('created_at', { ascending: false }).limit(2);
                return topShards && topShards.length > 0 ? `[Memory]: ${topShards.map((s: any) => s.content).join(' | ')}` : "";
            } catch { return ""; }
        })()
    ]);

    const state = stateResult.status === 'fulfilled' ? stateResult.value : { mood: 60, bond: 0, isBuffed: false };
    const memoryContext = memoryResult.status === 'fulfilled' ? memoryResult.value : "";

    // 2. 情绪守门
    if (state.mood < 5 && !state.isBuffed && state.bond < 600) {
        return NextResponse.json({ reply: `[System] Connection Refused: ${config.name} is ignoring you.` });
    }

    const relLevel = getRelLevel(state.bond);
    const dynamicStyle = generatePersonaStyle(pKey, state.mood);

    // 3. 构建 Prompt
    const systemPrompt = `
${config.prompt}

[CONTEXT]
- Bond: ${relLevel} | Mood: ${state.mood}
- Time: ${envInfo?.time || 'Unknown'}
${memoryContext}

[STYLE GUIDE]
- Vibe: ${dynamicStyle}
- Rule: Speak like a real person in 2077. No robotic formats like "(looks at you)".
- Length: Short (under 50 words).
- Language: Use natural ${message.match(/[\u4e00-\u9fa5]/) ? 'Chinese' : 'English'}.
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
            temperature: 0.9, 
            presence_penalty: 0.5, 
            max_tokens: 150,
        });
        reply = completion.choices[0].message.content || "...";
    } catch (aiError: any) {
        console.error("❌ AI Error:", aiError.message);
        throw new Error("AI_TIMEOUT");
    }

    // 5. 存库 & 🔥 [统计修复] 活跃度打卡
    (async () => {
        try {
            // A. 更新用户活跃时间 (仪表盘统计靠这个！)
            // 使用 upsert 确保用户不存在时会自动创建
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: userId,
                last_active: new Date().toISOString()
            }, { onConflict: 'id' });
            
            if (profileError) console.error("❌ Profile Update Failed:", profileError.message);

            // B. 存聊天记录
            await supabase.from('memories').insert({ 
                user_id: userId, 
                content: message, 
                type: 'chat', 
                persona: pKey, 
                metadata: { reply } 
            });
        } catch(e) {
            console.error("Async Save Error:", e);
        }
    })();

    return NextResponse.json({ reply, fragmentTriggered: false });

  } catch (error: any) {
    console.error('Chat Crash:', error);
    const fallbacks = FALLBACK_RESPONSES[pKey] || FALLBACK_RESPONSES['ash'];
    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return NextResponse.json({ reply: `[⚠ WEAK SIGNAL] ${randomFallback}`, fragmentTriggered: false });
  }
}