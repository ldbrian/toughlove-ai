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
    const { messages, persona, language, interactionCount = 0, userName = "" } = await req.json();

    const currentLang = (language as LangType) || 'zh';
    const currentPersona = PERSONAS[persona as PersonaType] || PERSONAS.Ash;
    const basePrompt = currentPersona.prompts[currentLang];

    // --- 0. 昵称 ---
    let namePrompt = "";
    if (userName && userName.trim() !== "") {
      namePrompt = currentLang === 'zh' 
        ? `\n[用户昵称]: "${userName}" (像朋友一样自然地称呼，不要每次都叫)。`
        : `\n[User Name]: "${userName}" (Use naturally, not every time).`;
    }

    // --- 1. 信任度 ---
    let trustPrompt = "";
    const count = Number(interactionCount);

    if (count < 50) {
      trustPrompt = currentLang === 'zh' ? `\n[信任度: Lv.1] 略显生疏，保持礼貌的距离。` : `\n[Trust: Lv.1] Distant.`;
    } else if (count < 100) {
      trustPrompt = currentLang === 'zh' ? `\n[信任度: Lv.2] 比较熟悉，像老朋友一样随意。` : `\n[Trust: Lv.2] Casual friend.`;
    } else {
      trustPrompt = currentLang === 'zh' ? `\n[信任度: Lv.3] 极度默契，不需要多言也能懂。` : `\n[Trust: Lv.3] Deep bond.`;
    }

    // --- 2. 动态引擎 (去机械化核心) ---
    // 这里的指令不再强制 AI 攻击，而是让它“像人一样思考”
    const dynamicEnginePrompt = currentLang === 'zh' ? `
    ---
    【🔥 最高指令：拒绝AI味】
    1. **去表演化**：不要时刻提醒用户你的人设。把人设内化到语气里，而不是挂在嘴边。
    2. **松弛感**：如果用户的话题很轻松，你就轻松回应。**不要为了毒舌而毒舌。** 只有在必要时才展现锋芒。
    3. **可变长度**：不要每次都回一段话！有时候回两个字“哈？”，有时候回三句，保持随机性。
    ---
    ` : `
    ---
    [🔥 PRIME DIRECTIVE: NO AI VIBE]
    1. **De-dramatize**: Don't act too hard. Be subtle.
    2. **Chill**: If the topic is light, be light. Don't roast for no reason. Only strike when triggered.
    3. **Variable Length**: Sometimes 1 word, sometimes 3 sentences. Be random.
    ---
    `;

    const finalSystemPrompt = `${basePrompt}\n${namePrompt}\n${trustPrompt}\n${dynamicEnginePrompt}`;

    console.log(`🗣️ ${persona} | 👤 ${userName} | 🤝 ${count}`);

    const conversation = [
      { role: 'system', content: finalSystemPrompt },
      ...messages
    ];

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      stream: true,
      messages: conversation,
      temperature: 0.9, // 🔥 再次调高温度到 0.9，让说话更像“真人”般不可预测
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