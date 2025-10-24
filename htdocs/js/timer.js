export class TimerManager extends EventTarget {
    constructor() {
        super();
        this.timeRemaining = 0;
        this.intervalId = null;
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        this.pausedDuration = 0;
    }
    
    start(seconds) {
        if (this.isRunning) {
            this.stop();
        }
        
        this.timeRemaining = seconds;
        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.pausedDuration = 0;
        
        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);
        
        this.dispatchEvent(new CustomEvent('start', { 
            detail: { remaining: this.timeRemaining } 
        }));
        
        // 初回tick
        this.tick();
    }
    
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.isRunning = false;
        this.isPaused = false;
        this.timeRemaining = 0;
        
        this.dispatchEvent(new CustomEvent('stop'));
    }
    
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.dispatchEvent(new CustomEvent('pause', { 
            detail: { remaining: this.timeRemaining } 
        }));
    }
    
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);
        
        this.dispatchEvent(new CustomEvent('resume', { 
            detail: { remaining: this.timeRemaining } 
        }));
    }
    
    tick() {
        if (!this.isRunning || this.isPaused) return;
        
        this.timeRemaining--;
        
        this.dispatchEvent(new CustomEvent('tick', { 
            detail: { remaining: this.timeRemaining } 
        }));
        
        if (this.timeRemaining <= 0) {
            this.complete();
        }
    }
    
    complete() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.isRunning = false;
        this.isPaused = false;
        this.timeRemaining = 0;
        
        this.dispatchEvent(new CustomEvent('complete'));
    }
    
    getTimeRemaining() {
        return this.timeRemaining;
    }
    
    getElapsedTime() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime - this.pausedDuration) / 1000);
    }
    
    getTotalDuration() {
        if (!this.startTime) return 0;
        const elapsed = this.getElapsedTime();
        return elapsed + this.timeRemaining;
    }
    
    getStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            timeRemaining: this.timeRemaining,
            elapsedTime: this.getElapsedTime(),
            totalDuration: this.getTotalDuration()
        };
    }
    
    // タイマーの時間をフォーマット（HH:MM:SS）
    static formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // 便利メソッド：イベントリスナー追加
    on(eventName, callback) {
        this.addEventListener(eventName, (event) => {
            if (eventName === 'tick' || eventName === 'start' || eventName === 'pause' || eventName === 'resume') {
                callback(event.detail.remaining);
            } else {
                callback(event);
            }
        });
    }
}

// バックグラウンド実行対応のためのWorkerベースタイマー（将来の拡張用）
export class BackgroundTimerManager extends TimerManager {
    constructor() {
        super();
        this.worker = null;
        this.lastCheck = null;
        this.setupBackgroundHandling();
    }
    
    setupBackgroundHandling() {
        // Page Visibility APIで画面の表示/非表示を検知
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.handleBackgroundMode();
                } else {
                    this.handleForegroundMode();
                }
            });
        }
        
        // Service Workerとの通信設定（将来実装）
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'TIMER_SYNC') {
                    this.syncWithServiceWorker(event.data);
                }
            });
        }
    }
    
    handleBackgroundMode() {
        this.lastCheck = Date.now();
        // バックグラウンドモードでの処理
    }
    
    handleForegroundMode() {
        if (this.lastCheck && this.isRunning) {
            const elapsed = Math.floor((Date.now() - this.lastCheck) / 1000);
            this.timeRemaining = Math.max(0, this.timeRemaining - elapsed);
            
            if (this.timeRemaining <= 0) {
                this.complete();
            } else {
                this.dispatchEvent(new CustomEvent('tick', { 
                    detail: { remaining: this.timeRemaining } 
                }));
            }
        }
        this.lastCheck = null;
    }
    
    syncWithServiceWorker(data) {
        // Service Workerからの同期データを処理
        if (data.timeRemaining !== undefined) {
            this.timeRemaining = data.timeRemaining;
            
            if (this.timeRemaining <= 0) {
                this.complete();
            } else {
                this.dispatchEvent(new CustomEvent('tick', { 
                    detail: { remaining: this.timeRemaining } 
                }));
            }
        }
    }
}