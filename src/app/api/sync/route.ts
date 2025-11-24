import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encrypt, decrypt } from '@/lib/crypto'; // 👈 引入加密工具

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const runtime = 'nodejs'; // ⚠️ 注意：crypto 库需要 nodejs 运行时，不能用 edge 了

// GET: 读取并解密
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const persona = searchParams.get('persona');

  if (!userId || !persona) return NextResponse.json({ messages: [] });

  const { data } = await supabase
    .from('chat_histories')
    .select('messages')
    .eq('user_id', userId)
    .eq('persona', persona)
    .single();

  let rawMessages = data?.messages || [];
  
  // 如果数据库里存的是加密字符串，需要解密
  // 注意：因为我们之前存的是 JSONB 数组，现在我们要把它转成字符串存，或者加密里面的 content
  // 为了 MVP 简单，我们采取全量 JSON stringify 后加密存储的策略
  // 但由于之前表结构 messages 是 jsonb，我们得做个兼容：
  // 方案：我们只加密 content 字段，或者...
  
  // 🔥 修正策略：为了兼容之前的 jsonb 结构，我们遍历数组，把 content 解密
  // 这种方式最稳妥，不用改表结构
  const decryptedMessages = Array.isArray(rawMessages) 
    ? rawMessages.map((m: any) => ({
        ...m,
        content: decrypt(m.content) // 尝试解密内容
      }))
    : [];

  return NextResponse.json({ messages: decryptedMessages });
}

// POST: 加密并保存
export async function POST(req: Request) {
  try {
    const { userId, persona, messages } = await req.json();

    if (!userId || !persona) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    // 🔥 加密处理：遍历消息，把 content 加密
    const encryptedMessages = messages.map((m: any) => ({
      ...m,
      content: encrypt(m.content) // 加密内容
    }));

    // 使用 Upsert
    const { error } = await supabase
      .from('chat_histories')
      .upsert({
        user_id: userId,
        persona: persona,
        messages: encryptedMessages, // 存入的是密文
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, persona' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}