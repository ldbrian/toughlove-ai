import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PERSONAS, PersonaType, LangType } from '@/lib/constants';

export const runtime = 'edge';

// 初始化 Supabase (使用服务端 Key 以确保读写权限)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-time-dummy-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { persona, userId, language } = await req.json();
    
    const currentLang = (language as LangType) || 'zh';
    const currentPersona = PERSONAS[persona as PersonaType] || PERSONAS.Ash;
    const today = new Date().toISOString().split('T')[0];

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // 1. 检查今日是否已生成 (恢复每日一次的逻辑)
    // 仪式感核心：每天点进来看到的都是那句定死的毒鸡汤
    const { data: existing } = await supabase
      .from('daily_quotes')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .eq('persona', persona) // 每个人格每天可以有一条不同的
      .single();

    if (existing) {
      return NextResponse.json(existing);
    }

    // 2. 如果今天没生成，去查“上一次”生成的记录 (用于去重)
    const { data: history } = await supabase
      .from('daily_quotes')
      .select('content')
      .eq('user_id', userId)
      .eq('persona', persona)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    const lastQuote = history?.content || "";

    // 3. 构建 Prompt
    const basePrompt = currentPersona.prompts[currentLang];
    
    // 🔥 核心优化：将历史记录注入 Prompt，强制避嫌
    let avoidInstruction = "";
    if (lastQuote) {
        avoidInstruction = currentLang === 'zh'
            ? `\n❌ 禁止生成与这就话类似的内容：“${lastQuote}”。必须换个角度骂。`
            : `\n❌ DO NOT repeat or paraphrase this previous quote: "${lastQuote}". Find a new angle.`;
    }

    const taskPrompt = currentLang === 'zh' 
      ? `请生成一句“今日毒签”。
         要求：
         1. 极度简短 (20字以内)。
         2. 犀利、冷幽默、不带引号。
         3. 随机性强，不要用套话。${avoidInstruction}`
      : `Generate a "Daily Toxic Quote". 
         Requirements:
         1. Short (<15 words).
         2. Savage, no quotes.
         3. High randomness. ${avoidInstruction}`;

    // 4. 调用 AI
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: basePrompt },
          { role: 'user', content: taskPrompt }
        ],
        temperature: 1.3, // 🔥 保持高温度，增加随机性
      }),
    });

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || (currentLang === 'zh' ? "今天不想骂你，滚吧。" : "Silence.");

    // 5. 存库 (锁定今日)
    await supabase.from('daily_quotes').insert({
      user_id: userId,
      date: today,
      content: content,
      persona: persona
    });

    return NextResponse.json({ date: today, content, persona });

  } catch (error) {
    console.error("Daily Quote Error:", error);
    return NextResponse.json({ error: 'Error generating quote' }, { status: 500 });
  }
}