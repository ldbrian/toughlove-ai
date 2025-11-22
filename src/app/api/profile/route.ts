import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { userId, language } = await req.json();
    if (!userId) return NextResponse.json({ error: 'No User ID' }, { status: 400 });

    // 1. 从数据库获取用户标签
    const { data: profile } = await supabase
      .from('profiles')
      .select('tags')
      .eq('id', userId)
      .single();

    const tags = profile?.tags || [];

    if (tags.length === 0) {
      return NextResponse.json({ 
        tags: [], 
        diagnosis: language === 'zh' ? "样本不足。请多聊几句，让我看清你的灵魂。" : "Insufficient data. Chat more to reveal your soul."
      });
    }

    // 2. 调用 AI 生成诊断
    // 随机选一个“主治医生”风格，这里我们用 Echo 的口吻
    const prompt = language === 'zh' 
      ? `你是一名冷酷的心理侧写师。根据以下用户标签：${JSON.stringify(tags)}。
         请给出一份简短、犀利、直击灵魂的“诊断评语”。
         要求：
         1. 100字以内。
         2. 不要罗列标签，要透过标签看本质。
         3. 风格：一针见血，略带嘲讽或深沉的同情。不要给建议。`
      : `You are a cold psychological profiler. Based on these user tags: ${JSON.stringify(tags)}.
         Write a short, sharp, soul-piercing "Diagnosis".
         Requirements:
         1. Under 60 words.
         2. Synthesize the essence.
         3. Style: Brutal truth or deep insight. No advice.`;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    });

    const diagnosis = response.choices[0].message.content;

    return NextResponse.json({ tags, diagnosis });

  } catch (error) {
    console.error("Profile API Error:", error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}