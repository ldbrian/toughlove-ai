// src/app/api/push/heartbeat/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 更新该用户所有设备订阅的 last_active 时间
    // 这样 Cron Job 就知道你最近来过，不需要发“召回通知”了
    const { error } = await supabase
      .from('push_subscriptions')
      .update({ last_active: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      console.error('[Heartbeat] Update failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}