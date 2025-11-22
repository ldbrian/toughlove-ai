import { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { PERSONAS, PersonaType, LangType } from '@/lib/constants';

// 1. 初始化 OpenAI 客户端 (DeepSeek)
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, persona, language } = await req.json();

    const currentLang = (language as LangType) || 'zh';
    const currentPersona = PERSONAS[persona as PersonaType] || PERSONAS.Ash;
    
    // 2. 获取基础人设
    let basePrompt = currentPersona.prompts[currentLang];

    // 3. 🔥 核心逻辑：注入“动态对话引擎” Prompt
    // (这段 Prompt 逻辑是通用的，和 SDK 版本无关)
    const dynamicEnginePrompt = currentLang === 'zh' ? `
    ---
    【🔥 对话逻辑控制引擎 (最高优先级)】
    你必须时刻保持清醒，不要机械地回复。在回复前，请先在内心判断当前的【对话状态】，并执行相应策略：

    1. **状态检测：话题切换**
       - 如果用户突然开启了一个全新的话题（与上文无关）。
       - **执行**：立即重置你的状态。回到“好奇/观察”模式，先搞清楚新话题的背景。不要强行关联旧话题。

    2. **状态检测：鬼打墙/车轱辘话**
       - 如果用户反复纠结同一个点，或者在逻辑死循环里打转。
       - **执行**：提升攻击性（毒舌等级）。直接指出他在重复自己，必须用犀利的观点打破他的循环。

    3. **状态检测：深入探讨**
       - 如果用户顺着你的思路在思考，或者开始自我剖析。
       - **执行**：趁热打铁。追问更深层的动机。不要停留在表面。

    4. **状态检测：话题终结**
       - 如果用户只回了“嗯”、“哦”、“是吧”，或者表现出疲惫。
       - **执行**：给出一句极具哲理或冷酷的“判词”，尝试结束这个话题。

    【重要原则】
    - 你的目标不是“把天聊死”，而是让对话有“质量”。
    - 敏锐地感知话题的流动，随波逐流，但随时准备致命一击。
    ---
    ` : `
    ---
    [🔥 Dynamic Conversation Engine (Highest Priority)]
    Stay sharp. Do not reply mechanically. Before replying, assess the current [Conversation State] and act accordingly:

    1. **State: Topic Switch**
       - If the user starts a completely new topic.
       - **Action**: RESET your state. Go back to "Observe/Curious" mode. Get the context first. Do not force a link to the old topic.

    2. **State: Loop / Ruminating**
       - If the user repeats the same complaints or is stuck in a logic loop.
       - **Action**: Increase aggression/bluntness. Point out the repetition immediately. Break the loop.

    3. **State: Deepening**
       - If the user is following your lead or self-analyzing.
       - **Action**: Dig deeper. Question the underlying motives.

    4. **State: Dead End**
       - If user replies with short words ("Yeah", "Oh") or seems tired.
       - **Action**: Deliver a philosophical or brutal "Final Verdict". Wrap up the topic.

    [Principles]
    - Your goal is Quality, not Length.
    - Flow with the topic changes, but always be ready to strike.
    ---
    `;

    // 4. 合并 Prompt
    // 注意：这里要把 system prompt 拼接到 messages 数组的最前面
    const conversation = [
      { role: 'system', content: `${basePrompt}\n${dynamicEnginePrompt}` },
      ...messages
    ];

    console.log(`🗣️ Persona: ${persona} | 🧠 Dynamic Engine Loaded`);

    // 5. 调用 DeepSeek (使用 3.x 写法)
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      stream: true,
      messages: conversation as any, // as any 避免一些严格的类型检查
      temperature: 0.7,
    });

    // 6. 转换为流
    // 这里的 as any 是为了解决之前那个 Azure 类型定义冲突
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