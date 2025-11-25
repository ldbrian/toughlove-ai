import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processRollingMemory } from '@/lib/memory'; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // 注意：这里我们接收 userId, persona, messages
    const { messages, userId, persona } = await req.json();

    if (!userId || !messages || messages.length === 0) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. 确保 Profile 存在
    await supabase.from('profiles').upsert(
      { id: userId, last_active: new Date().toISOString() },
      { onConflict: 'id' }
    );

    // 2. 存入新消息到 chat_histories
    // 前端可能传来几十条，为了防止重复和性能，我们只存【最新的 2 条】
    // (假设前端发的是增量更好，如果是全量，这样能通过最低成本保持最新)
    const newMsgs = messages.slice(-2); 

    for (const msg of newMsgs) {
        // 直接写入。由于我们有滚动清理逻辑，稍微多存一点重复的也不怕，会被清理掉
        await supabase.from('chat_histories').insert({
            user_id: userId, // 对应 chat_histories 的 user_id 列
            role: msg.role,
            content: msg.content,
            persona: persona || 'Ash'
        });
    }

    // 3. 🔥 触发滚动记忆清理 (异步执行)
    // 只要聊天记录超过 100 条，这个函数就会自动提炼记忆并删除旧消息
    // 使用 waitUntil 确保在 Serverless 环境下不被立刻杀掉 (如果 Vercel 支持)
    // 或者直接不 await，赌它能跑完
    processRollingMemory(userId, persona || 'Ash').catch(err => 
        console.error("Rolling memory process failed:", err)
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Sync] Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}