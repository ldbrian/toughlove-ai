// src/app/api/cron/pulse/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush, { PushSubscription } from 'web-push'; 

// 1. 初始化 Supabase (使用 Service Role Key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 确保使用 Service Role Key
);

// 2. 配置 WebPush 密钥
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT;

// 检查 VAPID 配置并初始化 web-push
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    console.error("VAPID Keys are missing. Push notifications will not work.");
} else {
    webpush.setVapidDetails(
        VAPID_SUBJECT,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
}

// 简单的触发逻辑：查找不活跃用户
const getTriggeredSubscriptions = async () => {
    // 🔥 MVP 触发逻辑：查找过去 6 小时内没有 last_active 记录的用户订阅
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('user_id, subscription, last_active')
        // 只有 last_active 早于 6 小时的订阅才会被选中
        .lt('last_active', sixHoursAgo); 
        
    if (error) {
        console.error("Error fetching subscriptions for pulse:", error);
        return [];
    }
    
    return subscriptions || [];
};

// 简单的消息生成器（Sol 的心跳）
const generatePulseMessage = (persona: string) => {
    // ⚠️ 暂时使用 Sol 的心跳，后续 v3.0 的复杂唤醒逻辑将在这里实现
    const messagePayload = {
        title: "Sol: 喂！",
        body: "你上次活动是在六小时前。快动起来，去吃点东西！",
        persona: 'sol',
        url: `/chat/sol` // 点击后跳转到 Sol 的聊天室
    };

    return messagePayload;
};


export async function GET(req: Request) {
    // 🔥 安全检查：确保只有定时任务能调用此 API
    const { searchParams } = new URL(req.url);
    const cronKey = searchParams.get('key');
    
    if (!process.env.CRON_SECRET || cronKey !== process.env.CRON_SECRET) { 
        return NextResponse.json({ error: 'Unauthorized: Missing or invalid key' }, { status: 401 });
    }

    try {
        const subscriptionsToPulse = await getTriggeredSubscriptions();
        let sentCount = 0;
        let successCount = 0;

        // 如果没有需要唤醒的用户
        if (subscriptionsToPulse.length === 0) {
             return NextResponse.json({ 
                success: true, 
                message: `No inactive users found.` 
            });
        }

        for (const sub of subscriptionsToPulse) {
            const personaToUse = 'sol'; 
            const messagePayload = generatePulseMessage(personaToUse);
            
            // 封装推送内容
            const payload = JSON.stringify({
                title: messagePayload.title,
                body: messagePayload.body,
                data: { 
                    url: messagePayload.url, 
                    persona: messagePayload.persona 
                }
            });

            try {
                // 3. 发送推送通知
                await webpush.sendNotification(
                    sub.subscription as PushSubscription,
                    payload
                );
                successCount++;
            } catch (error: any) {
                // 如果订阅过期（例如用户卸载了 PWA），HTTP 状态码通常是 410
                if (error.statusCode === 410 && sub.subscription.endpoint) { 
                    console.log(`[Push] Subscription expired for endpoint: ${sub.subscription.endpoint}. Deleting...`);
                    // 异步删除过期订阅，不阻塞当前循环
                    supabase.from('push_subscriptions').delete().eq('subscription->>endpoint', sub.subscription.endpoint).then(res => {
                        if (res.error) console.error("Failed to delete expired subscription:", res.error);
                    });
                } else {
                    console.error(`[Push] Failed to send notification to user ${sub.user_id}:`, error);
                }
            }
            sentCount++;
        }

        return NextResponse.json({ 
            success: true, 
            message: `Pulse check completed. Attempted: ${sentCount}, Succeeded: ${successCount}` 
        });

    } catch (e: any) {
        console.error("[Pulse Cron] Critical Error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}