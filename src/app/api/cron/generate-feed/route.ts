import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

// ----------------------------------------------------------------------
// 1. 静态配置 (保留英文 Key 以便 AI 理解，但描述可以保留中文)
// ----------------------------------------------------------------------
const PERSONAS_CONFIG = {
  ASH: { 
    name: 'Ash',
    role: 'Editorial', 
    style: 'Stoic, strict, rational. Criticizes weakness. Metaphors: machines, entropy.',
    bgImage: '/wallpapers/ash_clinic.jpg', 
    color: '#22d3ee',
    preferredType: 'EDITORIAL'
  },
  VEE: { 
    name: 'Vee',
    role: 'Tabloid', 
    style: 'Chaotic, glitchy, cynical. Conspiracy theories, leaks, rumors.',
    bgImage: '/wallpapers/vee_room.jpg', 
    color: '#f472b6',
    preferredType: 'TABLOID'
  },
  SOL: { 
    name: 'Sol',
    role: 'Social', 
    style: 'High energy, aggressive positivity. Gym bro, action-oriented.',
    bgImage: '/wallpapers/sol_gym.jpg', 
    color: '#fb923c',
    preferredType: 'SOCIAL'
  },
  RIN: { 
    name: 'Rin',
    role: 'Healer', 
    style: 'Gentle, poetic, empathetic. Dreams, rain, tarot metaphors.',
    bgImage: '/wallpapers/rin_room.jpg', 
    color: '#a855f7',
    preferredType: 'EDITORIAL'
  },
  ECHO: { 
    name: 'Echo',
    role: 'Observer', 
    style: 'Neutral, robotic, objective. Data logs, weather reports.',
    bgImage: '/wallpapers/echo_room.jpg', 
    color: '#94a3b8',
    preferredType: 'NEWS'
  }
};

// 兜底数据 (双语版)
const FALLBACK_ITEMS = [
  {
    author: "ASH",
    title: { en: "System Discipline", zh: "系统纪律协议" },
    type: "EDITORIAL",
    content: {
        en: "The city sleeps, but code does not. **Discipline is survival.** Optimize your metrics.",
        zh: "城市在沉睡，但代码永不休息。**自律即生存。** 优化你的指标，否则将被淘汰。"
    },
    actionLabel: { en: "OPTIMIZE", zh: "执行优化" },
    comments: [{ 
        persona: "VEE", 
        stance: "MOCK", 
        content: { en: "Boring!", zh: "真无聊！" } 
    }]
  }
];

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL;
    const modelName = process.env.OPENAI_MODEL_NAME || "deepseek-chat";

    if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

    const openai = new OpenAI({ apiKey, baseURL: baseUrl });

    const now = new Date();
    const localHour = (now.getUTCHours() + 8) % 24; 
    let timeVibe = "NEUTRAL";
    if (localHour >= 5 && localHour < 12) timeVibe = "MORNING FOG";
    else if (localHour >= 12 && localHour < 18) timeVibe = "HIGH NOON";
    else if (localHour >= 18 && localHour < 23) timeVibe = "NEON NIGHT";
    else timeVibe = "DEEP VOID";

    const allKeys = Object.keys(PERSONAS_CONFIG);
    const selectedKeys = allKeys.sort(() => 0.5 - Math.random()).slice(0, 3);
    const topics = ['Firewall Update', 'Synthetic Rain', 'Neuro-Link Addiction', 'Old World Relics', 'AI Dreaming', 'Memory Costs'];

    // ------------------------------------------------------------------
    // 2. 双语 Prompt
    // ------------------------------------------------------------------
    const systemPrompt = `
You are the Editorial Board of "Tough Love OS".
**TASK: Generate content in BOTH English (en) and Simplified Chinese (zh).**

OUTPUT FORMAT (JSON Array):
[
  {
    "author": "NAME",
    "title": { "en": "English Title", "zh": "中文标题" },
    "type": "EDITORIAL/NEWS/TABLOID/SOCIAL/SYSTEM",
    "content": { 
        "en": "English content in Markdown. Use **bold**.", 
        "zh": "中文内容，Markdown格式。使用 **加粗**。" 
    },
    "actionLabel": { "en": "Verb", "zh": "动词" },
    "comments": [
       { 
         "persona": "NAME", 
         "stance": "AGREE/DISAGREE/MOCK", 
         "content": { "en": "Comment", "zh": "评论内容" } 
       }
    ]
  }
]
`;

    const userPrompt = `
Context: ${timeVibe}.
Authors: ${selectedKeys.join(', ')}.
Topics: ${topics.slice(0, 3).join(', ')}.
Generate 3 items. Ensure translations are culturally adapted, not machine-translated.
`;

    // ------------------------------------------------------------------
    // 3. 调用 AI
    // ------------------------------------------------------------------
    let items = [];
    
    try {
        console.log("[Feed Gen] Requesting Bilingual Content...");
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: modelName,
            temperature: 0.7,
            max_tokens: 3000, // 增加 token 因为双语内容长
            stream: false,
        });

        let raw = completion.choices[0].message.content || "";
        raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
        items = JSON.parse(raw);
    } catch (e: any) {
        console.error("❌ API Error:", e.message);
        items = FALLBACK_ITEMS;
    }

    if (!Array.isArray(items)) items = FALLBACK_ITEMS;

    // ------------------------------------------------------------------
    // 4. 写入数据库
    // ------------------------------------------------------------------
    await prisma.heroFeedItem.deleteMany({}); 

    const VALID_TYPES = ['EDITORIAL', 'NEWS', 'TABLOID', 'SOCIAL', 'SYSTEM'];
    const createdItems = [];

    for (const item of items) {
      const key = item.author ? item.author.toUpperCase() : "ECHO";
      const persona = PERSONAS_CONFIG[key as keyof typeof PERSONAS_CONFIG] || PERSONAS_CONFIG.ECHO;
      
      let safeType = (item.type || 'EDITORIAL').toUpperCase();
      if (!VALID_TYPES.includes(safeType)) safeType = persona.preferredType;

      try {
          const newItem = await prisma.heroFeedItem.create({
            data: {
              personaName: persona.name,
              type: safeType as any,
              // 🔥 直接存入 JSON 对象
              title: item.title,     
              content: item.content,
              actionLabel: item.actionLabel,
              
              visualConfig: { 
                bgImage: persona.bgImage, 
                primaryColor: persona.color,
                author: persona.name,
                label: safeType 
              },
              
              actionLink: `/chat/${persona.name.toLowerCase()}`, 
              priority: key === 'ASH' ? 10 : 5, 
              
              comments: {
                create: (item.comments || []).map((c: any) => ({
                  personaName: c.persona || "Echo",
                  // 🔥 评论也存 JSON
                  content: c.content, 
                  stance: (c.stance || 'NEUTRAL').toUpperCase(), 
                  actionLink: `/chat/${(c.persona || 'echo').toLowerCase()}` 
                }))
              }
            }
          });
          createdItems.push(newItem);
      } catch (dbError) {
          console.error("Save Error:", dbError);
      }
    }

    return NextResponse.json({ success: true, count: createdItems.length });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}