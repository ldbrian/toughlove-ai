import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { content, userId } = await req.json();

    if (!content) return NextResponse.json({ error: 'Empty content' }, { status: 400 });

    const systemPrompt = `你是一位敏锐的心理侧写师 Echo。用户正在向你倾诉日记。
    任务：
    1. 捕捉用户当下的情绪状态、潜意识动机。
    2. 提取 3-5 个精准的【情绪/状态标签】（如：#焦虑 #渴望认可 #内耗中）。
    3. 写一句【简短洞察】（30字以内），一针见血地点破他的状态。
    
    ⚠️ 严格输出纯 JSON 格式，不要包含 Markdown 符号：
    { "tags": ["tag1", "tag2"], "insight": "..." }`;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content }
      ],
      temperature: 0.7,
    });

    let rawContent = response.choices[0].message.content || '{}';
    
    // 🔥 修复：清洗 Markdown 格式 (```json ... ```)
    rawContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();

    let result;
    try {
        result = JSON.parse(rawContent);
    } catch (e) {
        console.error("JSON Parse Error:", rawContent);
        // 降级处理，防止前端白屏
        result = { tags: ["#分析中"], insight: rawContent.slice(0, 50) || "内心迷雾重重，看不清。" };
    }

    const tags = result.tags || [];
    const insight = result.insight || "内心迷雾重重，看不清。";

    if (userId) {
        const { error } = await supabase.from('memories').insert({
            user_id: userId,
            type: 'insight_echo',
            content: insight,
            metadata: { tags: tags }
        });
        if (error) console.error("DB Insert Error:", error);
    }

    return NextResponse.json({ tags, insight });

  } catch (error) {
    console.error("Diary API Error:", error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}