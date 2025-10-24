export class NotificationManager {
    constructor() {
        this.permission = Notification.permission;
        this.isSupported = 'Notification' in window;
        this.serviceWorkerRegistration = null;
        
        this.defaultOptions = {
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: 'stretch-timer',
            requireInteraction: false,
            silent: false,
            vibrate: [200, 100, 200]
        };
        
        this.init();
    }
    
    async init() {
        if (!this.isSupported) {
            console.warn('Notifications are not supported');
            return;
        }
        
        // Service Worker登録を取得
        if ('serviceWorker' in navigator) {
            try {
                this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
            } catch (error) {
                console.warn('Service Worker not available for notifications:', error);
            }
        }
        
        // 権限状態の監視
        this.updatePermissionStatus();
    }
    
    updatePermissionStatus() {
        this.permission = Notification.permission;
        console.log('Notification permission status:', this.permission);
    }
    
    async requestPermission() {
        if (!this.isSupported) {
            return 'not-supported';
        }
        
        if (this.permission === 'granted') {
            return 'granted';
        }
        
        if (this.permission === 'denied') {
            console.warn('Notification permission has been denied');
            return 'denied';
        }
        
        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            this.updatePermissionStatus();
            return permission;
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            return 'error';
        }
    }
    
    canShowNotifications() {
        return this.isSupported && this.permission === 'granted';
    }
    
    async showNotification(title, message, options = {}) {
        if (!this.canShowNotifications()) {
            console.warn('Cannot show notification: permission not granted or not supported');
            return null;
        }
        
        const notificationOptions = {
            ...this.defaultOptions,
            ...options,
            body: message,
            timestamp: Date.now()
        };
        
        try {
            // Service Workerが利用可能な場合はそれを使用
            if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.showNotification) {
                const notification = await this.serviceWorkerRegistration.showNotification(title, notificationOptions);
                console.log('Notification shown via Service Worker:', title);
                return notification;
            } else {
                // フォールバック：通常のNotification API
                const notification = new Notification(title, notificationOptions);
                this.setupNotificationEvents(notification);
                console.log('Notification shown via Notification API:', title);
                return notification;
            }
        } catch (error) {
            console.error('Failed to show notification:', error);
            return null;
        }
    }
    
    setupNotificationEvents(notification) {
        notification.addEventListener('click', (event) => {
            console.log('Notification clicked');
            notification.close();
            
            // アプリにフォーカスを当てる
            if ('parent' in window && window.parent !== window) {
                window.parent.focus();
            } else {
                window.focus();
            }
            
            // カスタムイベントを発火
            window.dispatchEvent(new CustomEvent('notificationClick', {
                detail: { notification, event }
            }));
        });
        
        notification.addEventListener('close', (event) => {
            console.log('Notification closed');
            window.dispatchEvent(new CustomEvent('notificationClose', {
                detail: { notification, event }
            }));
        });
        
        notification.addEventListener('error', (event) => {
            console.error('Notification error:', event);
            window.dispatchEvent(new CustomEvent('notificationError', {
                detail: { notification, event }
            }));
        });
        
        notification.addEventListener('show', (event) => {
            console.log('Notification shown');
            window.dispatchEvent(new CustomEvent('notificationShow', {
                detail: { notification, event }
            }));
        });
    }
    
    // ストレッチタイマー用の定型通知
    async showStretchNotification() {
        return await this.showNotification(
            'ストレッチの時間です！', 
            '立位になって指定の方向を向いてください。',
            {
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-192.png',
                tag: 'stretch-reminder',
                requireInteraction: true,
                actions: [
                    {
                        action: 'start',
                        title: 'ストレッチを開始',
                        icon: '/icons/icon-192.png'
                    },
                    {
                        action: 'snooze',
                        title: '5分後に再通知',
                        icon: '/icons/icon-192.png'
                    }
                ]
            }
        );
    }
    
    async showCompletionNotification() {
        return await this.showNotification(
            'ストレッチ完了！', 
            '素晴らしい！次のストレッチまでお疲れさまでした。',
            {
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-192.png',
                tag: 'stretch-complete',
                requireInteraction: false,
                vibrate: [100, 50, 100, 50, 200]
            }
        );
    }
    
    async showReminderNotification(minutesUntilNext) {
        const message = `次のストレッチまであと${minutesUntilNext}分です。`;
        
        return await this.showNotification(
            'ストレッチリマインダー',
            message,
            {
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-192.png',
                tag: 'stretch-reminder-countdown',
                requireInteraction: false
            }
        );
    }
    
    // 定期的な通知のスケジューリング
    scheduleNotification(title, message, delay, options = {}) {
        if (!this.canShowNotifications()) {
            console.warn('Cannot schedule notification: permission not granted');
            return null;
        }
        
        const timeoutId = setTimeout(async () => {
            await this.showNotification(title, message, options);
        }, delay);
        
        console.log(`Notification scheduled in ${delay}ms: ${title}`);
        return timeoutId;
    }
    
    cancelScheduledNotification(timeoutId) {
        if (timeoutId) {
            clearTimeout(timeoutId);
            console.log('Scheduled notification cancelled');
        }
    }
    
    // 通知の一括削除
    async clearNotifications(tag = null) {
        if (!this.serviceWorkerRegistration) {
            console.warn('Cannot clear notifications: Service Worker not available');
            return;
        }
        
        try {
            const notifications = await this.serviceWorkerRegistration.getNotifications({
                tag: tag || undefined
            });
            
            notifications.forEach(notification => notification.close());
            console.log(`Cleared ${notifications.length} notifications`);
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        }
    }
    
    // 通知履歴の取得
    async getActiveNotifications() {
        if (!this.serviceWorkerRegistration) {
            return [];
        }
        
        try {
            return await this.serviceWorkerRegistration.getNotifications();
        } catch (error) {
            console.error('Failed to get active notifications:', error);
            return [];
        }
    }
    
    // バイブレーション機能
    vibrate(pattern = [200, 100, 200]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
            console.log('Vibration triggered:', pattern);
            return true;
        } else {
            console.warn('Vibration not supported');
            return false;
        }
    }
    
    // 通知のテスト
    async testNotification() {
        const permission = await this.requestPermission();
        
        if (permission !== 'granted') {
            alert('通知の許可が必要です。ブラウザの設定から通知を有効にしてください。');
            return false;
        }
        
        await this.showNotification(
            'テスト通知',
            'ストレッチタイマーの通知が正常に動作しています。',
            {
                tag: 'test-notification',
                requireInteraction: false
            }
        );
        
        return true;
    }
    
    // 通知設定の確認
    getStatus() {
        return {
            isSupported: this.isSupported,
            permission: this.permission,
            canShow: this.canShowNotifications(),
            hasServiceWorker: !!this.serviceWorkerRegistration
        };
    }
    
    // 権限状態の詳細情報
    getPermissionDetails() {
        const status = this.getStatus();
        let message = '';
        let canRequest = false;
        
        switch (status.permission) {
            case 'granted':
                message = '通知が有効です。';
                break;
            case 'denied':
                message = '通知が拒否されています。ブラウザの設定から許可してください。';
                break;
            case 'default':
                message = '通知の許可が必要です。';
                canRequest = true;
                break;
            default:
                message = '通知の状態を確認できません。';
        }
        
        if (!status.isSupported) {
            message = 'このブラウザでは通知がサポートされていません。';
        }
        
        return {
            ...status,
            message,
            canRequest
        };
    }
    
    // デバッグ情報
    getDebugInfo() {
        return {
            isSupported: this.isSupported,
            permission: this.permission,
            hasServiceWorker: !!this.serviceWorkerRegistration,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            maxActions: Notification.maxActions || 'unknown'
        };
    }
}

// 通知権限要求のヘルパー関数
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return 'not-supported';
    }
    
    if (Notification.permission === 'granted') {
        return 'granted';
    }
    
    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (error) {
        console.error('Failed to request notification permission:', error);
        return 'error';
    }
}

// 通知サポート確認関数
export function isNotificationSupported() {
    return 'Notification' in window;
}

// 通知テストヘルパー
export async function testNotification(title = 'テスト通知', message = '通知のテストです。') {
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
        return false;
    }
    
    try {
        const notification = new Notification(title, {
            body: message,
            icon: '/icons/icon-192.png',
            tag: 'test'
        });
        
        setTimeout(() => notification.close(), 5000);
        return true;
    } catch (error) {
        console.error('Test notification failed:', error);
        return false;
    }
}