import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PERSONAS, PersonaType, LangType } from '@/lib/constants';

// 移除 Edge Runtime 提高稳定性
// export const runtime = 'edge';

const initSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("❌ [API Daily] Missing Env Vars");
    return null;
  }
  return createClient(url, key);
};

export async function POST(req: Request) {
  try {
    const { persona, userId, language } = await req.json();
    const currentLang = (language as LangType) || 'zh';
    const currentPersona = PERSONAS[persona as PersonaType] || PERSONAS.Ash;
    const today = new Date().toISOString().split('T')[0];

    const supabase = initSupabase();
    
    // 1. 尝试从数据库读取今日毒签
    if (supabase && userId) {
        const { data: existing } = await supabase
          .from('daily_quotes')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .eq('persona', persona)
          .single();

        if (existing) {
          console.log("✅ [API Daily] Found existing quote");
          return NextResponse.json(existing);
        }
    }

    // 2. 如果没有，调用 AI 生成
    console.log("👉 [API Daily] Generating new quote...");
    
    // 查上一条记录用于去重（可选，失败不影响主流程）
    let lastQuote = "";
    if (supabase && userId) {
        const { data: history } = await supabase
          .from('daily_quotes')
          .select('content')
          .eq('user_id', userId)
          .eq('persona', persona)
          .order('date', { ascending: false })
          .limit(1)
          .single();
        lastQuote = history?.content || "";
    }

    const basePrompt = currentPersona.prompts[currentLang];
    const avoidInstruction = lastQuote 
        ? (currentLang === 'zh' ? `\n❌ 禁止重复意思："${lastQuote}"` : `\n❌ Avoid: "${lastQuote}"`) 
        : "";

    const taskPrompt = currentLang === 'zh' 
      ? `生成一句“今日毒签”。极短(20字内)、犀利、冷幽默、不带引号。${avoidInstruction}`
      : `Generate a "Daily Toxic Quote". Short (<15 words), savage, no quotes. ${avoidInstruction}`;

    const aiRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
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
        temperature: 1.3,
      }),
    });

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || (currentLang === 'zh' ? "今天不想骂你，滚吧。" : "Silence.");

    // 3. 存入数据库 (如果数据库配置正确)
    if (supabase && userId) {
        const { error } = await supabase.from('daily_quotes').insert({
          user_id: userId,
          date: today,
          content: content,
          persona: persona || 'Ash' // 🔥 确保 persona 不为空
        });
        if (error) console.error("❌ [API Daily] Save Failed:", error.message);
    }

    return NextResponse.json({ date: today, content, persona });

  } catch (error: any) {
    console.error("❌ [API Daily] Error:", error);
    // 兜底返回，防止前端白屏
    return NextResponse.json({ 
        date: new Date().toISOString().split('T')[0], 
        content: "系统有点累，先歇会儿。", 
        persona: 'Ash' 
    });
  }
}