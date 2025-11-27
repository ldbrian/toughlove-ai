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

    if (!messages || messages.length === 0) {
      return NextResponse.json({ greeting: null });
    }

    const recentContext = messages.slice(-6).map((m: any) => 
      `[${m.role}]: ${m.content}`
    ).join('\n');

    const { time, weekday, phase, weather } = envInfo || {};

    // 🔥🔥🔥 核心修复：语言强制指令 🔥🔥🔥
    const LANGUAGE_CONSTRAINT = currentLang === 'zh'
      ? "⚠️ 必须使用【中文】回复。"
      : "⚠️ MUST reply in 【ENGLISH】 only.";

    const systemPrompt = currentLang === 'zh'
      ? `你现在是 ${persona}。你需要主动给用户发一条微信。
         【当前环境】：${weekday} ${time} (${phase})。天气：${weather}。
         【历史对话】：
         ${recentContext}
         
         【任务】：
         1. 结合环境和历史发起话题。
         2. 保持人设。
         3. 字数20字以内。
         ${LANGUAGE_CONSTRAINT}`
      
      : `You are ${persona}. Send a text to the user.
         [Context]: ${weekday} ${time} (${phase}). Weather: ${weather}.
         [History]: ${recentContext}
         
         [Task]:
         1. Combine context & history.
         2. Stay in character.
         3. Keep it short (under 20 words).
         ${LANGUAGE_CONSTRAINT}`;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: systemPrompt }],
      temperature: 0.9, 
    });

    const greeting = response.choices[0].message.content;
    return NextResponse.json({ greeting });

  } catch (error) {
    console.error("Greet API Error:", error);
    return NextResponse.json({ greeting: null });
  }
}