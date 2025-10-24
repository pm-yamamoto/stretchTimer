export class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.isInstallable = false;
        this.registration = null;
        this.updateAvailable = false;
        
        this.init();
    }
    
    async init() {
        this.checkInstallationStatus();
        this.setupInstallPrompt();
        await this.registerServiceWorker();
        this.setupUpdateHandler();
    }
    
    checkInstallationStatus() {
        // PWAがインストールされているかチェック
        this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true;
        
        console.log('PWA installation status:', this.isInstalled ? 'Installed' : 'Not installed');
    }
    
    setupInstallPrompt() {
        // beforeinstallpromptイベントをキャッチ
        window.addEventListener('beforeinstallprompt', (event) => {
            console.log('PWA install prompt available');
            
            // デフォルトの促進を防止
            event.preventDefault();
            
            // イベントを保存
            this.deferredPrompt = event;
            this.isInstallable = true;
            
            // カスタムイベントを発火
            window.dispatchEvent(new CustomEvent('pwaInstallable'));
        });
        
        // インストール完了イベント
        window.addEventListener('appinstalled', (event) => {
            console.log('PWA was installed');
            this.isInstalled = true;
            this.isInstallable = false;
            this.deferredPrompt = null;
            
            window.dispatchEvent(new CustomEvent('pwaInstalled'));
        });
    }
    
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Workers not supported');
            return;
        }
        
        try {
            this.registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', this.registration);
            
            // 更新チェック
            this.registration.addEventListener('updatefound', () => {
                console.log('Service Worker update found');
                this.handleServiceWorkerUpdate();
            });
            
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
    
    handleServiceWorkerUpdate() {
        if (!this.registration) return;
        
        const newWorker = this.registration.installing;
        if (!newWorker) return;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New Service Worker installed, update available');
                this.updateAvailable = true;
                
                // 更新通知イベントを発火
                window.dispatchEvent(new CustomEvent('pwaUpdateAvailable', {
                    detail: { registration: this.registration }
                }));
            }
        });
    }
    
    setupUpdateHandler() {
        // Service Workerからのメッセージを受信
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'CACHE_UPDATED') {
                console.log('Cache updated, refresh recommended');
                
                window.dispatchEvent(new CustomEvent('pwaCacheUpdated'));
            }
        });
        
        // 手動更新チェック
        if (this.registration) {
            // 定期的な更新チェック（1時間毎）
            setInterval(() => {
                this.registration.update();
            }, 60 * 60 * 1000);
        }
    }
    
    async promptInstall() {
        if (!this.deferredPrompt) {
            console.warn('Install prompt not available');
            return { success: false, reason: 'not-available' };
        }
        
        try {
            // インストールプロンプトを表示
            this.deferredPrompt.prompt();
            
            // ユーザーの選択を待つ
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log('Install prompt result:', outcome);
            
            if (outcome === 'accepted') {
                this.deferredPrompt = null;
                this.isInstallable = false;
                return { success: true, outcome };
            } else {
                return { success: false, outcome };
            }
        } catch (error) {
            console.error('Install prompt failed:', error);
            return { success: false, error };
        }
    }
    
    async updateApp() {
        if (!this.updateAvailable || !this.registration) {
            console.warn('No update available');
            return false;
        }
        
        try {
            // 待機中のService Workerをアクティブ化
            const waitingWorker = this.registration.waiting;
            if (waitingWorker) {
                waitingWorker.postMessage({ type: 'SKIP_WAITING' });
            }
            
            // ページリロード
            window.location.reload();
            return true;
        } catch (error) {
            console.error('Update failed:', error);
            return false;
        }
    }
    
    async checkForUpdates() {
        if (!this.registration) {
            console.warn('Service Worker not registered');
            return false;
        }
        
        try {
            await this.registration.update();
            console.log('Update check completed');
            return true;
        } catch (error) {
            console.error('Update check failed:', error);
            return false;
        }
    }
    
    // オフライン状態の管理
    setupOfflineHandling() {
        window.addEventListener('online', () => {
            console.log('App is online');
            this.updateOnlineStatus(true);
        });
        
        window.addEventListener('offline', () => {
            console.log('App is offline');
            this.updateOnlineStatus(false);
        });
        
        // 初期状態を設定
        this.updateOnlineStatus(navigator.onLine);
    }
    
    updateOnlineStatus(isOnline) {
        document.body.classList.toggle('app-offline', !isOnline);
        
        window.dispatchEvent(new CustomEvent('connectivityChange', {
            detail: { isOnline }
        }));
    }
    
    // PWAの状態取得
    getStatus() {
        return {
            isInstalled: this.isInstalled,
            isInstallable: this.isInstallable,
            hasServiceWorker: !!this.registration,
            updateAvailable: this.updateAvailable,
            isOnline: navigator.onLine,
            standalone: this.isInstalled
        };
    }
    
    // インストール可能性のチェック
    canInstall() {
        return this.isInstallable && !!this.deferredPrompt;
    }
    
    // インストールボタンの表示状態制御
    showInstallButton(show = true) {
        const installButton = document.getElementById('installButton');
        if (installButton) {
            installButton.style.display = show && this.canInstall() ? 'block' : 'none';
        }
    }
    
    // 更新通知の表示
    showUpdateNotification(show = true) {
        const updateNotification = document.getElementById('updateNotification');
        if (updateNotification) {
            updateNotification.style.display = show && this.updateAvailable ? 'block' : 'none';
        }
    }
    
    // キャッシュサイズの取得（概算）
    async getCacheSize() {
        if (!('caches' in window)) return null;
        
        try {
            const cacheNames = await caches.keys();
            let totalSize = 0;
            
            for (const cacheName of cacheNames) {
                const cache = await caches.open(cacheName);
                const requests = await cache.keys();
                
                for (const request of requests) {
                    const response = await cache.match(request);
                    if (response) {
                        const blob = await response.blob();
                        totalSize += blob.size;
                    }
                }
            }
            
            return {
                totalBytes: totalSize,
                totalMB: (totalSize / 1024 / 1024).toFixed(2),
                cacheNames: cacheNames
            };
        } catch (error) {
            console.error('Failed to calculate cache size:', error);
            return null;
        }
    }
    
    // キャッシュのクリア
    async clearCache(cacheName = null) {
        if (!('caches' in window)) return false;
        
        try {
            if (cacheName) {
                await caches.delete(cacheName);
                console.log(`Cache cleared: ${cacheName}`);
            } else {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(name => caches.delete(name))
                );
                console.log('All caches cleared');
            }
            return true;
        } catch (error) {
            console.error('Failed to clear cache:', error);
            return false;
        }
    }
    
    // デバッグ情報
    getDebugInfo() {
        return {
            ...this.getStatus(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            language: navigator.language,
            registration: !!this.registration,
            deferredPrompt: !!this.deferredPrompt
        };
    }
    
    // 便利メソッド：イベントリスナー追加
    on(eventName, callback) {
        window.addEventListener(eventName, callback);
    }
    
    // 便利メソッド：イベントリスナー削除
    off(eventName, callback) {
        window.removeEventListener(eventName, callback);
    }
}

// PWA関連のヘルパー関数
export function isPWAInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
}

export function isPWASupported() {
    return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
}

export function isRunningStandalone() {
    return isPWAInstalled();
}

export function getDisplayMode() {
    if (isPWAInstalled()) {
        return 'standalone';
    }
    return 'browser';
}

// PWAインストール促進のUI制御
export class PWAInstallPrompt {
    constructor(pwaManager) {
        this.pwaManager = pwaManager;
        this.isVisible = false;
        this.element = null;
        
        this.init();
    }
    
    init() {
        this.createElement();
        this.setupEventListeners();
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'pwa-install-prompt';
        this.element.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: var(--bg-primary, white);
            border: 1px solid var(--border-light, #e0e0e0);
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            transform: translateY(100%);
            transition: transform 0.3s ease;
            display: none;
        `;
        
        this.element.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <img src="/icons/icon-192.png" alt="アプリアイコン" style="width: 40px; height: 40px; margin-right: 12px;">
                <div>
                    <h3 style="margin: 0; font-size: 16px;">ストレッチタイマーをインストール</h3>
                    <p style="margin: 4px 0 0; font-size: 14px; color: var(--text-secondary, #666);">
                        ホーム画面から素早くアクセス
                    </p>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="pwa-install-btn" style="
                    flex: 1;
                    background: var(--color-primary, #4CAF50);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                ">インストール</button>
                <button class="pwa-close-btn" style="
                    background: transparent;
                    color: var(--text-secondary, #666);
                    border: 1px solid var(--border-light, #e0e0e0);
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                ">後で</button>
            </div>
        `;
        
        document.body.appendChild(this.element);
    }
    
    setupEventListeners() {
        this.element.querySelector('.pwa-install-btn').addEventListener('click', async () => {
            const result = await this.pwaManager.promptInstall();
            if (result.success) {
                this.hide();
            }
        });
        
        this.element.querySelector('.pwa-close-btn').addEventListener('click', () => {
            this.hide();
        });
        
        // PWAインストール可能時に表示
        this.pwaManager.on('pwaInstallable', () => {
            this.show();
        });
        
        // PWAインストール完了時に非表示
        this.pwaManager.on('pwaInstalled', () => {
            this.hide();
        });
    }
    
    show() {
        if (this.isVisible || this.pwaManager.isInstalled) return;
        
        this.isVisible = true;
        this.element.style.display = 'block';
        
        requestAnimationFrame(() => {
            this.element.style.transform = 'translateY(0)';
        });
    }
    
    hide() {
        if (!this.isVisible) return;
        
        this.element.style.transform = 'translateY(100%)';
        
        setTimeout(() => {
            this.isVisible = false;
            this.element.style.display = 'none';
        }, 300);
    }
}