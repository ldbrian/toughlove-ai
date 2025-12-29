// public/service-worker.js

// ==========================================
// PART 1: PWA 缓存逻辑 (保持不变)
// ==========================================
const CACHE_NAME = 'toughlove-cache-v1';
const OFFLINE_URL = '/';

// 需要缓存的静态资源 (图标等)
const ASSETS_TO_CACHE = [
  '/',
  '/icon.png',
  '/icon.svg',
  '/manifest.json'
];

// 1. 安装事件：缓存核心文件
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. 激活事件：清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. 请求拦截：优先使用缓存
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// ==========================================
// PART 2: v3.0 主动唤醒 (新增 Push 逻辑) 🔥 补全这部分
// ==========================================

// 4. 监听推送事件 (Push)
self.addEventListener('push', function(event) {
  if (!event.data) return;

  // 解析后端发来的 JSON
  const data = event.data.json();
  const { title, body, icon, data: notificationData } = data;

  const options = {
    body: body || '有新的消息',
    icon: icon || '/avatars/sol_hero.jpg', // 默认可以用 Sol 的头像，或者 '/icon.png'
    badge: '/icon.png', // Android 状态栏小图标
    vibrate: [100, 50, 100], // 震动模式
    data: {
      url: notificationData?.url || '/', 
      persona: notificationData?.persona || 'System'
    },
    actions: [
      { action: 'open', title: '查看' },
      { action: 'close', title: '忽略' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title || 'TOUGH Love', options)
  );
});

// 5. 监听通知点击事件 (Notification Click)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'close') return;

  // 点击通知打开窗口或聚焦已有窗口
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      const url = event.notification.data.url || '/';
      
      // 尝试聚焦已打开的 Tab
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // 否则打开新窗口
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});