// Service Worker for Stretch Timer PWA
// TEMPORARY: ngrokテスト用に機能を簡素化
const CACHE_NAME = 'stretch-timer-v1';
const STATIC_CACHE_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/style.css',
    '/css/responsive.css',
    '/css/dark-theme.css',
    '/js/app.js',
    '/js/timer.js',
    '/js/orientation.js',
    '/js/notification.js',
    '/js/storage.js',
    '/js/pwa.js'
];

// インストール時
self.addEventListener('install', (event) => {
    console.log('[SW] Install event');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static files');
                return cache.addAll(STATIC_CACHE_FILES);
            })
            .then(() => {
                console.log('[SW] All static files cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache files:', error);
            })
    );
});

// アクティベート時
self.addEventListener('activate', (event) => {
    console.log('[SW] Activate event');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] All old caches deleted');
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('[SW] Failed to activate:', error);
            })
    );
});

// フェッチ時
self.addEventListener('fetch', (event) => {
    // HTMLリクエストの場合
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('/')
                .then((response) => {
                    return response || fetch(event.request);
                })
                .catch(() => {
                    return caches.match('/');
                })
        );
        return;
    }

    // 静的リソースの場合
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    console.log('[SW] Serving from cache:', event.request.url);
                    return response;
                }
                
                console.log('[SW] Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then((response) => {
                        // 有効なレスポンスのみキャッシュ
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    });
            })
            .catch((error) => {
                console.error('[SW] Fetch failed:', error);
                
                // オフライン時のフォールバック
                if (event.request.destination === 'document') {
                    return caches.match('/');
                }
            })
    );
});

// バックグラウンドでのメッセージ処理
self.addEventListener('message', (event) => {
    console.log('[SW] Received message:', event.data);
    
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
                
            case 'SET_TIMER':
                handleTimerMessage(event.data);
                break;
                
            case 'SHOW_NOTIFICATION':
                showNotification(event.data);
                break;
                
            case 'GET_VERSION':
                event.ports[0].postMessage({
                    type: 'VERSION_RESPONSE',
                    version: CACHE_NAME
                });
                break;
                
            default:
                console.log('[SW] Unknown message type:', event.data.type);
        }
    }
});

// タイマー関連の処理
function handleTimerMessage(data) {
    const { duration, startTime } = data;
    
    // バックグラウンドタイマーの処理
    setTimeout(() => {
        showNotification({
            title: 'ストレッチの時間です！',
            body: 'スマホを持って立ち上がりましょう',
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: 'stretch-reminder',
            requireInteraction: true,
            actions: [
                {
                    action: 'start-stretch',
                    title: 'ストレッチ開始'
                },
                {
                    action: 'snooze',
                    title: '5分後に再通知'
                }
            ]
        });
    }, duration);
}

// 通知表示
function showNotification(data) {
    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192.png',
        badge: data.badge || '/icons/icon-192.png',
        tag: data.tag || 'default',
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || [],
        vibrate: [200, 100, 200],
        data: {
            url: '/',
            timestamp: Date.now()
        }
    };
    
    return self.registration.showNotification(data.title, options);
}

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.notification);
    
    event.notification.close();
    
    if (event.action === 'start-stretch') {
        // ストレッチ開始アクション
        event.waitUntil(
            clients.openWindow('/?action=stretch')
        );
    } else if (event.action === 'snooze') {
        // スヌーズアクション
        setTimeout(() => {
            showNotification({
                title: 'ストレッチの時間です！（再通知）',
                body: 'スマホを持って立ち上がりましょう',
                tag: 'stretch-reminder-snooze'
            });
        }, 5 * 60 * 1000); // 5分後
    } else {
        // デフォルトアクション：アプリを開く
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clients) => {
                    for (let client of clients) {
                        if (client.url.includes(self.location.origin) && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    return clients.openWindow('/');
                })
        );
    }
});

// 通知を閉じた時の処理
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed:', event.notification);
});

// バックグラウンド同期（将来の機能拡張用）
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'stretch-data-sync') {
        event.waitUntil(syncStretchData());
    }
});

// ストレッチデータ同期（スタブ実装）
async function syncStretchData() {
    try {
        // 将来的にはサーバーとの同期処理を実装
        console.log('[SW] Syncing stretch data...');
        
        // 現在はローカルストレージのみなので何もしない
        return Promise.resolve();
    } catch (error) {
        console.error('[SW] Failed to sync data:', error);
        throw error;
    }
}

// エラーハンドリング
self.addEventListener('error', (event) => {
    console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] Unhandled promise rejection:', event.reason);
});

// Service Workerの状態をログ出力
console.log('[SW] Service Worker loaded');
console.log('[SW] Cache name:', CACHE_NAME);
console.log('[SW] Static files to cache:', STATIC_CACHE_FILES.length);