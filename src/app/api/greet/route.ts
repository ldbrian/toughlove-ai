import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { PERSONAS, PersonaType, LangType } from '@/lib/constants';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, persona, language, envInfo, userName } = await req.json();
    const currentLang = (language as LangType) || 'zh';

    // 如果没有历史记录，就没法“承接”，直接返回空，让前端用默认开场白
    if (!messages || messages.length === 0) {
      return NextResponse.json({ greeting: null });
    }

    // 提取最近的一段对话
    const recentContext = messages.slice(-6).map((m: any) => 
      `[${m.role}]: ${m.content}`
    ).join('\n');

    const { time, weekday, phase, weather } = envInfo || {};

    // Prompt: 要求 AI 结合环境 + 历史，主动发起话题
    const systemPrompt = currentLang === 'zh'
      ? `你现在是 ${persona}。你需要主动给用户发一条微信。
         【当前环境】：${weekday} ${time} (${phase})。天气：${weather}。
         【历史对话】：你们上次聊到了以下内容：
         ${recentContext}
         
         【任务】：
         1. **结合环境**：比如饭点问吃饭没，深夜问睡没睡，下雨问带伞没。
         2. **承接历史**：如果上次话题比较沉重（如失恋），要表达隐晦的关心；如果上次很轻松，就随意一点。
         3. **保持人设**：Ash要毒舌，Rin要傲娇。
         4. **字数**：20字以内，像朋友一样随口一问。不要长篇大论。`
      
      : `You are ${persona}. Send a text to the user.
         [Context]: ${weekday} ${time} (${phase}). Weather: ${weather}.
         [History]: ${recentContext}
         
         [Task]:
         1. Combine context (meal time / weather / late night).
         2. Bridge from last topic.
         3. Stay in character.
         4. Keep it short (under 20 words).`;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: systemPrompt }],
      temperature: 0.9, // 高创造性
    });

    const greeting = response.choices[0].message.content;
    return NextResponse.json({ greeting });

  } catch (error) {
    console.error("Greet API Error:", error);
    return NextResponse.json({ greeting: null });
  }
}