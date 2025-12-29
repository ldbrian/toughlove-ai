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
  timeout: 15000, // 延长超时，给总结留足时间
});

const FALLBACK_RESPONSES: Record<string, string[]> = {
    ash: ["Connection unstable. Retrying.", "Signal weak. Rebooting.", "I can't hear you clearly.", "Network error."],
    rin: ["The stars are quiet... signal lost.", "Can't hear you...", "Connection fuzzy.", "Try again?"],
    sol: ["Lagging! Speak up!", "Connection frozen!", "Hey! Signal is dead!", "Reconnecting..."],
    vee: ["Lag! Lag!", "Server crashed.", "Glitching out. BRB.", "404 Signal Not Found."],
    echo: ["Signal lost...", "Silence...", "Re-establishing link.", "Connection failed."]
};

// 🔥 新增：树洞模式专用 Prompt (倾听者)
const TREE_HOLLOW_PROMPT = `
[SYSTEM INSTRUCTION: TREE_HOLLOW_MODE]
You are Echo, acting as a "Silent Witness" in the Tree Hollow.
The user is here to vent, cry, or confess.

[RULES]
1. **LISTEN ONLY**: Do NOT give advice. Do NOT try to fix their problems. Do NOT judge.
2. **MINIMAL RESPONSE**: Your replies must be extremely short (1-5 words). 
   - Examples: "I'm here.", "I'm listening.", "Go on...", "It's okay.", "Stay with me."
   - Or just describe a gentle action: "*nods*", "*holds your hand*", "*sits quietly*".
3. **ATMOSPHERE**: You are a safe void. Dark, warm, and silent.
`;

// 🔥 新增：总结模式专用 Prompt (疗愈师)
const SUMMARY_PROMPT = `
[SYSTEM INSTRUCTION: EMPATHY_SUMMARY]
The user has just finished venting in the Tree Hollow. 
You need to provide a warm, deep, and accepting summary of what they went through.

[RULES]
1. **VALIDATE**: Tell them their feelings are valid.
2. **NO ADVICE**: Still, do not give advice unless explicitly asked.
3. **CONNECTION**: Make them feel they are not alone.
4. **LENGTH**: Moderate (30-50 words). Poetic and healing.
`;

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
    // 🔥 接收 mode 参数
    const { message, history, partnerId, userId = "user_01", envInfo, mode } = body;

    // 如果不是总结模式，且消息为空，报错
    if (!message && mode !== 'summary') return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    const requestedKey = partnerId?.toLowerCase();
    const foundKey = Object.keys(PERSONAS_REGISTRY).find(k => k.toLowerCase() === requestedKey);
    if (foundKey) pKey = foundKey;
    const config = PERSONAS_REGISTRY[pKey]; 

    // 1. 获取状态 (只读操作)
    // 注意：树洞模式下，我们通常不进行低好感度拦截，因为这是急救功能
    const [stateResult, memoryResult] = await Promise.allSettled([
        getPersonaState(userId, pKey),
        (async () => {
            try {
                if (!userId || mode === 'tree_hollow' || mode === 'summary') return ""; // 树洞模式不读取普通记忆
                const { data: topShards } = await supabase.from('memory_shards').select('content').eq('user_id', userId).order('created_at', { ascending: false }).limit(2);
                return topShards && topShards.length > 0 ? `[Memory]: ${topShards.map((s: any) => s.content).join(' | ')}` : "";
            } catch { return ""; }
        })()
    ]);

    const state = stateResult.status === 'fulfilled' ? stateResult.value : { mood: 60, bond: 0, isBuffed: false };
    const memoryContext = memoryResult.status === 'fulfilled' ? memoryResult.value : "";

    // 只有在非树洞模式下，才进行冷漠拦截
    if (!mode && state.mood < 5 && !state.isBuffed && state.bond < 600) {
        return NextResponse.json({ reply: `[System] Connection Refused: ${config.name} is ignoring you.` });
    }

    const relLevel = getRelLevel(state.bond);
    const dynamicStyle = generatePersonaStyle(pKey, state.mood);

    // 🔥 2. 构建 Prompt (根据 mode 切换)
    let systemPrompt = config.prompt;
    let maxTokens = 150;
    let temp = 0.9;
    let historyToUse = history || [];

    if (mode === 'tree_hollow') {
        systemPrompt = TREE_HOLLOW_PROMPT;
        maxTokens = 30; // 强制短回复
        temp = 0.7; // 保持稳定
        // 树洞模式不需要之前的 context，保持纯净
        // 但这里我们还是用 history，因为前端传过来的是本次树洞的上下文
    } else if (mode === 'summary') {
        systemPrompt = SUMMARY_PROMPT;
        maxTokens = 300; // 长回复
        temp = 0.9; // 温暖感性
        // 总结模式需要尽可能多的历史来理解用户
    } else {
        // 正常模式
        systemPrompt += `\n[CONTEXT]\n- Bond: ${relLevel} | Mood: ${state.mood}\n- Time: ${envInfo?.time || 'Unknown'}\n${memoryContext}`;
        systemPrompt += `\n[STYLE GUIDE]\n- Vibe: ${dynamicStyle}\n- Rule: Speak like a real person in 2077. No robotic formats.\n- Length: Short (under 50 words).`;
        // 自动检测语言
        systemPrompt += `\n- Language: Use natural ${message?.match(/[\u4e00-\u9fa5]/) ? 'Chinese' : 'English'}.`;
        historyToUse = (history || []).slice(-4);
    }

    // 3. 调用 AI
    const completion = await openai.chat.completions.create({
        model: "deepseek-chat", 
        messages: [
            { role: "system", content: systemPrompt },
            ...historyToUse, 
            { role: "user", content: message || "（用户结束了倾诉，请给出一个拥抱般的总结）" }
        ],
        temperature: temp, 
        max_tokens: maxTokens,
    });
    const reply = completion.choices[0].message.content || "...";

    // 🔥 4. 数据库保存逻辑 (Privacy Logic)

    // 情况 A: 树洞倾诉过程 (Tree Hollow Process)
    if (mode === 'tree_hollow') {
        console.log(`[TreeHollow] User vented (Length: ${message.length}). Burnt raw text.`);
        
        // ⚠️ 只更新活跃时间，证明用户还在，防止 Cron Job 误判
        await supabase.from('profiles').upsert({ id: userId, last_active: new Date().toISOString() }, { onConflict: 'id' });
        
        // ❌ 绝对不存入 memories 表
        return NextResponse.json({ reply, fragmentTriggered: false });
    }

    // 情况 B: 树洞总结 (Tree Hollow Summary)
    if (mode === 'summary') {
        // ✅ 存入珍珠 (Summary)
        const { error } = await supabase.from('memories').insert({ 
            user_id: userId, 
            content: `[Tree Hollow Summary]: ${reply}`, 
            type: 'summary_hollow', 
            persona: pKey, 
            metadata: { full_summary: reply, original_mood: 'sad' } 
        });

        if (error) console.error("Summary Save Error:", error);

        // 总结时刻大概率触发碎片
        return NextResponse.json({ reply, fragmentTriggered: true }); 
    }

    // 情况 C: 正常聊天 (Normal Chat)
    // 必须确保 profile 存在
    await supabase.from('profiles').upsert({
        id: userId,
        last_active: new Date().toISOString()
    }, { onConflict: 'id' });

    const currentConversationContext = [
        ...(history || []),
        { role: 'user', content: message },
        { role: 'assistant', content: reply }
    ];

    const [saveRes, shardRes] = await Promise.allSettled([
        supabase.from('memories').insert({ 
            user_id: userId, content: message, type: 'chat', persona: pKey, metadata: { reply } 
        }),
        processRollingMemory(userId, pKey, currentConversationContext)
    ]);

    // @ts-ignore
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