import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const runtime = 'edge';

// GET: 读取历史记录
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

  return NextResponse.json({ messages: data?.messages || [] });
}

// POST: 保存历史记录
export async function POST(req: Request) {
  try {
    const { userId, persona, messages } = await req.json();

    if (!userId || !persona) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    // 使用 Upsert (有则更新，无则插入)
    const { error } = await supabase
      .from('chat_histories')
      .upsert({
        user_id: userId,
        persona: persona,
        messages: messages,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, persona' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}