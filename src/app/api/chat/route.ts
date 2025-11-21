import { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { PERSONAS, PersonaType, LangType } from '@/lib/constants';

// 初始化 DeepSeek
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

// 强制使用 Edge Runtime
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, persona, language } = await req.json();

    const currentLang = (language as LangType) || 'zh';
    const currentPersona = PERSONAS[persona as PersonaType] || PERSONAS.Ash;
    const systemPrompt = currentPersona.prompts[currentLang];

    // 构建对话
    const conversation = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // 请求 DeepSeek
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      stream: true,
      messages: conversation,
      temperature: 0.7,
      max_tokens: 500,
    });

    // 👇 核心修复：加了 "as any" 忽略类型检查
    // 因为 DeepSeek 返回的是标准流，肯定能用，不用管 TS 报的 Azure 字段缺失错误
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