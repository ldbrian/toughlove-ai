// src/app/api/push/subscribe/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 使用 Service Role Key 绕过 RLS 写入
);

export async function POST(req: Request) {
  try {
    const { subscription, userId, userAgent } = await req.json();

    if (!subscription || !userId) {
        return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Upsert 逻辑：如果同一个 user_id 的订阅发生变化，则更新
    // 注意：实际生产中，一个用户可能有多个设备，这里简化为每个用户只保留最新设备
    // 或者你可以根据 subscription.endpoint 来做唯一键
    const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
            user_id: userId,
            subscription: subscription,
            user_agent: userAgent,
            last_active: new Date().toISOString()
        }, { onConflict: 'user_id' }); // 这里简化为覆盖旧设备，如果你支持多设备，请去掉 onConflict 或改 key

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Push API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}