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
  // 强制立即激活，不用等待旧的 SW 停止
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
  // 立即接管所有页面
  return self.clients.claim();
});

// 3. 请求拦截：优先使用缓存 (Cache First) 或 网络优先 (Network First)
// 这里使用 Stale-While-Revalidate 策略的简化版：先网络，失败走缓存
self.addEventListener('fetch', (event) => {
  // 只处理 HTTP/HTTPS 请求 (过滤 chrome-extension 等)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 如果网络请求成功，克隆一份存入缓存（更新缓存）
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // 网络失败（离线），尝试读取缓存
        return caches.match(event.request);
      })
  );
});