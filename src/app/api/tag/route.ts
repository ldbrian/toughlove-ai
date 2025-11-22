import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
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
  let newTags: string[] = [];

  try {
    const { messages, userId } = await req.json();
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({ tags: [] });
    }

    const recentContext = messages.slice(-10).map((m: any) => `${m.role}: ${m.content}`).join('\n');
    const systemPrompt = `你是一个用户画像侧写师。
    根据对话提取3-5个用户标签。
    返回格式必须是纯 JSON 字符串数组，例如：["焦虑", "失恋"]。
    不要包含 markdown 格式。`;

    console.log("🤖 Tag API: Calling DeepSeek...");

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `对话记录：\n${recentContext}` }
      ],
      temperature: 0.5,
    });

    const content = response.choices[0].message.content || '[]';
    console.log("📦 Tag API Raw Output:", content);

    try {
      // 清理 markdown
      const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      newTags = Array.isArray(parsed) ? parsed : (parsed.tags || []);
    } catch (e) {
      console.error("❌ Tag API JSON Parse Failed. Raw:", content);
      // 👇 修复正则：使用 [\s\S] 替代 s 标志，兼容旧版 TS
      const match = content.match(/\[[\s\S]*?\]/);
      if (match) {
        try { newTags = JSON.parse(match[0]); } catch {}
      }
    }

    if (newTags.length > 0 && userId) {
      console.log(`💾 Tag API: Saving to DB for user ${userId}...`);
      
      const { error } = await supabase.from('profiles').upsert({
        id: userId, 
        tags: newTags,
        last_active: new Date().toISOString()
      }, { onConflict: 'id' });

      if (error) {
        console.error("🔥 Tag API Supabase Error:", error.message);
      } else {
        console.log("✅ Tag API: Saved to DB success.");
      }
    }

    return NextResponse.json({ tags: newTags });

  } catch (error: any) {
    console.error("🔥 Tag API Fatal Error:", error.message);
    return NextResponse.json({ tags: newTags.length > 0 ? newTags : [] });
  }
}