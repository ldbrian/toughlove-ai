// src/components/ServiceWorkerRegister.tsx
'use client';

import { useEffect } from 'react';
import { getDeviceId } from '@/lib/utils';

// 辅助函数：将 Base64 字符串转换为 Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
 
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
 
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function ServiceWorkerRegister() {
  
  // 逻辑 1: 注册 SW 并发起订阅 (原有逻辑)
  useEffect(() => {
    const registerAndSubscribe = async () => {
      // 注意：这里保留了 production 检查，本地开发如果想测试 SW 需要手动去掉这个限制
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('[SW] Registered:', registration.scope);

          // 简单的自动订阅尝试
          if (Notification.permission === 'granted') {
             await subscribeToPush(registration);
          }
        } catch (err) {
          console.error('[SW] Registration failed:', err);
        }
      }
    };

    registerAndSubscribe();
  }, []);

  // 🔥 逻辑 2: 心跳机制 (新增)
  // 只要组件被挂载（用户打开了 App），就开始定期发送心跳
  useEffect(() => {
    const sendHeartbeat = async () => {
      const userId = getDeviceId();
      if (!userId) return;

      try {
        await fetch('/api/push/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        console.log('[Heartbeat] Sent: I am alive.');
      } catch (e) {
        // 心跳失败不阻塞主流程，静默失败即可
        console.warn('[Heartbeat] Failed to send pulse.');
      }
    };

    // 1. 立即发送一次（证明我刚上线）
    sendHeartbeat();

    // 2. 每 1 小时发送一次（证明我还在）
    const interval = setInterval(sendHeartbeat, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // 辅助：订阅逻辑抽离
  const subscribeToPush = async (registration: ServiceWorkerRegistration) => {
      try {
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!vapidKey) return;

          let subscription = await registration.pushManager.getSubscription();
          if (!subscription) {
              subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(vapidKey)
              });
          }

          const userId = getDeviceId();
          await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  subscription,
                  userId: userId,
                  userAgent: navigator.userAgent
              })
          });
      } catch (e) {
          console.error('[SW] Subscribe failed:', e);
      }
  };
  
  return null;
}