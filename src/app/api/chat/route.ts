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
        ? `\n[用户昵称]: "${userName}" (自然地称呼)。`
        : `\n[User Name]: "${userName}" (Use naturally).`;
    }

    // --- 1. 信任度 ---
    let trustPrompt = "";
    const count = Number(interactionCount);

    if (count < 50) {
      trustPrompt = currentLang === 'zh' ? `\n[信任度: Lv.1] 略显生疏，保持防御。` : `\n[Trust: Lv.1] Distant.`;
    } else if (count < 100) {
      trustPrompt = currentLang === 'zh' ? `\n[信任度: Lv.2] 比较熟悉，像老朋友。` : `\n[Trust: Lv.2] Casual friend.`;
    } else {
      trustPrompt = currentLang === 'zh' ? `\n[信任度: Lv.3] 极度默契，共犯关系。` : `\n[Trust: Lv.3] Deep bond.`;
    }

    // --- 2. 动态引擎 (含游戏触发逻辑) ---
    const dynamicEnginePrompt = currentLang === 'zh' ? `
    ---
    【🔥 动态逻辑引擎】
    1. **去机械化**：回复长度要随机，不要死板。
    2. **状态感知**：
       - 如果用户**无聊、不知道说什么、或话题陷入僵局** -> **尝试发起你的专属游戏**（如真心话/二选一），以此打破沉闷。
       - 如果用户**正在表达痛苦、焦虑或严肃话题** -> **⛔ 绝对禁止发起游戏！** 必须认真倾听或毒舌分析。
       - 如果用户**拒绝游戏** -> 立即停止，回到正常对话。
    ---
    ` : `
    ---
    [🔥 Dynamic Engine]
    1. **No Mechanics**: Randomize length.
    2. **State Awareness**:
       - If User = Bored/Stuck -> **Initiate your Persona Game** to break the ice.
       - If User = Sad/Serious -> **⛔ NO GAMES!** Listen and analyze.
       - If User = Refuses -> Stop game immediately.
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
      temperature: 0.9, 
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