import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PERSONAS, PersonaType, LangType } from '@/lib/constants';

export async function POST(req: Request) {
  try {
    const { persona, userId, language } = await req.json(); // 接收 language
    
    const currentLang = (language as LangType) || 'zh';
    const currentPersona = PERSONAS[persona as PersonaType] || PERSONAS.Ash;
    const today = new Date().toISOString().split('T')[0];

    // 查库：注意加上 language 筛选，因为同一个人同一天可能想看英文版毒签
    // (如果数据库没有 language 字段，可能需要清理一下旧数据或者只存一种)
    // 为了简单，我们这里假设存进去的内容就是生成时的语言，不强行改数据库结构
    // 如果要严格区分，建议在 daily_quotes 表加一个 language 字段
    
    const { data: existing } = await supabase
      .from('daily_quotes')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      // .eq('language', currentLang) // 理想情况下应该加这个过滤
      .single();

    if (existing) {
      // 简单判断：如果取出来的也是当前的语言（通过正则或简单检测），就返回
      // 这里 MVP 简化处理：直接返回，不管语言（或者用户手动清缓存）
      return NextResponse.json(existing);
    }

    // 生成 Prompt
    const basePrompt = currentPersona.prompts[currentLang];
    const taskPrompt = currentLang === 'zh' 
      ? '请生成一句“今日毒签”。要求：极度简短(20字以内)。不带引号。'
      : 'Generate a "Daily Toxic Quote". Requirement: Extremely short (under 15 words). No quotes.';

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
        temperature: 1.0,
      }),
    });

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;

    // 存库
    await supabase.from('daily_quotes').insert({
      user_id: userId,
      date: today,
      content: content,
      persona: persona
    });

    return NextResponse.json({ date: today, content, persona });

  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}