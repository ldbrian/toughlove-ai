import { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { PERSONAS, PersonaType, LangType } from '@/lib/constants';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, persona, language, interactionCount = 0 } = await req.json();

    const currentLang = (language as LangType) || 'zh';
    const currentPersona = PERSONAS[persona as PersonaType] || PERSONAS.Ash;
    const basePrompt = currentPersona.prompts[currentLang];

    // --- 1. 信任度 ---
    let trustPrompt = "";
    const count = Number(interactionCount);

    if (count < 50) {
      trustPrompt = currentLang === 'zh' ? `\n[信任度：低] 保持高冷防御。` : `\n[Trust: Low] Be guarded.`;
    } else if (count < 100) {
      trustPrompt = currentLang === 'zh' ? `\n[信任度：中] 可以稍微放松。` : `\n[Trust: Mid] Relax a bit.`;
    } else {
      trustPrompt = currentLang === 'zh' ? `\n[信任度：高] 你们是共犯。` : `\n[Trust: High] Partner in crime.`;
    }

    // --- 2. 动态引擎 (去除了死板的格式要求) ---
    // 核心修改：不再强调 "MUST use |||"，而是强调 "Variation" (多样性)
    const dynamicEnginePrompt = currentLang === 'zh' ? `
    ---
    【🔥 最高指令：拟人化】
    1. **禁止机械感**：不要每次都回复相同的长度或结构！
    2. **结构多样性**：根据当前情绪，自由决定发 1 条还是 3 条。如果是追问，可能很短；如果是分析，可能稍长。
    3. **状态感知**：敏锐感知话题流动。如果用户换话题，请重置状态。
    ---
    ` : `
    ---
    [🔥 PRIME DIRECTIVE: BE HUMAN]
    1. **No Mechanics**: Do NOT use the same structure every time!
    2. **Variety**: Freely decide to send 1 sentence or 3 bursts based on mood. Short for questions, longer for analysis.
    3. **Awareness**: Sense the topic flow.
    ---
    `;

    const finalSystemPrompt = `${basePrompt}\n${trustPrompt}\n${dynamicEnginePrompt}`;

    console.log(`🗣️ ${persona} | 🤝 ${count} | 🧠 Logic Loaded`);

    const conversation = [
      { role: 'system', content: finalSystemPrompt },
      ...messages
    ];

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      stream: true,
      messages: conversation,
      temperature: 0.85, // 🔥 核心修改：稍微调高温度，增加随机性和创造性 (之前是 0.7)
    });

    const stream = OpenAIStream(response as any);
    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: 'Failed to connect to AI' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}