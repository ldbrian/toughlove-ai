import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processRollingMemory } from '@/lib/memory'; 

// 初始化 Supabase (带防崩兜底)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-time-dummy-key'
);

// 🔥 1. 处理数据同步 (保存消息 + 触发记忆提炼)
export async function POST(req: NextRequest) {
  try {
    const { messages, userId, persona } = await req.json();

    if (!userId || !messages || messages.length === 0) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. 确保 Profile 存在
    await supabase.from('profiles').upsert(
      { id: userId, last_active: new Date().toISOString() },
      { onConflict: 'id' }
    );

    // 2. 存入新消息 (只存最新的2条，避免重复)
    const newMsgs = messages.slice(-2); 
    for (const msg of newMsgs) {
        await supabase.from('chat_histories').insert({
            user_id: userId,
            role: msg.role,
            content: msg.content,
            persona: persona || 'Ash',
            created_at: new Date().toISOString()
        });
    }

    // 3. 触发滚动记忆清理 (不阻塞返回)
    processRollingMemory(userId, persona || 'Ash').catch(err => 
        console.error("Rolling memory process failed:", err)
    );

    // ✅ 核心修复：必须返回一个 Response！
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Sync POST] Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// 🔥 2. 新增：获取历史记录 (修复 405 错误)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const persona = searchParams.get('persona');

    if (!userId || !persona) {
      return NextResponse.json({ messages: [] });
    }

    // 从 chat_histories 表里查最近的 100 条
    const { data } = await supabase
      .from('chat_histories')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .eq('persona', persona)
      .order('created_at', { ascending: true }) // 按时间正序排列
      .limit(100);

    if (!data) {
        return NextResponse.json({ messages: [] });
    }

    // 格式化为 AI SDK 需要的格式
    const formattedMessages = data.map((msg: any) => ({
        id: new Date(msg.created_at).getTime().toString(), // 临时 ID
        role: msg.role,
        content: msg.content
    }));

    return NextResponse.json({ messages: formattedMessages });

  } catch (error) {
    console.error('[Sync GET] Error:', error);
    return NextResponse.json({ messages: [] }); // 出错返回空数组，别崩
  }
}