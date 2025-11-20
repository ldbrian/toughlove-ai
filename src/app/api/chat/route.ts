import { NextResponse } from 'next/server';
import { PERSONAS, PersonaType, LangType } from '@/lib/constants';

export async function POST(req: Request) {
  try {
    const { messages, persona, language } = await req.json(); // 接收 language
    
    const currentLang = (language as LangType) || 'zh';
    const currentPersona = PERSONAS[persona as PersonaType] || PERSONAS.Ash;
    
    // 根据语言选择对应的 System Prompt
    const systemPrompt = currentPersona.prompts[currentLang];

    const conversation = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: conversation,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) throw new Error('DeepSeek API Error');

    const data = await response.json();
    return NextResponse.json({ role: 'assistant', content: data.choices[0].message.content });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}