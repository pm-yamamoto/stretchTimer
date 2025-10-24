/**
 * iOS対応タッチヘルパー
 * iPhoneでのボタンタップ問題を解決するためのユーティリティ
 */

export class TouchHelper {
    constructor() {
        this.isTouch = 'ontouchstart' in window;
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        // タッチ開始位置を記録（スクロールとタップの区別用）
        this.touchStartData = new Map();
        
        this.init();
    }
    
    init() {
        // iOS Safariでの300ms遅延を回避
        if (this.isMobile) {
            this.setupFastClick();
        }
        
        // iOS専用の最適化
        if (this.isIOS) {
            this.setupIOSOptimizations();
        }
    }
    
    setupFastClick() {
        // viewport設定でタップ遅延を無効化（既にHTMLで設定済みだが念のため）
        let viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            const content = viewport.getAttribute('content');
            if (!content.includes('user-scalable=no')) {
                viewport.setAttribute('content', content + ', user-scalable=no');
            }
        }
    }
    
    setupIOSOptimizations() {
        // iOS Safari のスクロール改善
        document.body.style.webkitOverflowScrolling = 'touch';
        
        // タッチイベントの passive 設定
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), {
            passive: true
        });
        
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), {
            passive: false
        });
    }
    
    handleTouchStart(event) {
        // タッチ開始位置を記録
        for (let touch of event.touches) {
            this.touchStartData.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
                timestamp: Date.now()
            });
        }
    }
    
    handleTouchMove(event) {
        // スクロール中のタッチを検出
        for (let touch of event.touches) {
            const startData = this.touchStartData.get(touch.identifier);
            if (startData) {
                const deltaX = Math.abs(touch.clientX - startData.x);
                const deltaY = Math.abs(touch.clientY - startData.y);
                
                // 大きな移動はスクロールとして扱い、タップではない
                if (deltaX > 10 || deltaY > 10) {
                    this.touchStartData.delete(touch.identifier);
                }
            }
        }
    }
    
    /**
     * iOS対応のイベントリスナーを追加
     * @param {Element} element - 対象要素
     * @param {Function} callback - コールバック関数
     * @param {Object} options - オプション
     */
    addTouchListener(element, callback, options = {}) {
        if (!element) return;
        
        const { 
            preventDefault = false, 
            stopPropagation = false,
            debounce = 100 
        } = options;
        
        let lastCallTime = 0;
        
        const handleEvent = (event) => {
            const now = Date.now();
            
            // デバウンス処理
            if (now - lastCallTime < debounce) {
                return;
            }
            lastCallTime = now;
            
            if (preventDefault) {
                event.preventDefault();
            }
            if (stopPropagation) {
                event.stopPropagation();
            }
            
            // iOS対応のタッチフィードバック
            this.addTouchFeedback(element);
            
            callback(event);
        };
        
        // 複数のイベントタイプに対応
        if (this.isTouch) {
            // タッチデバイスでは touchend を主に使用
            element.addEventListener('touchend', (event) => {
                // スクロールされていない場合のみタップとして処理
                const touch = event.changedTouches[0];
                const startData = this.touchStartData.get(touch.identifier);
                
                if (startData) {
                    const deltaX = Math.abs(touch.clientX - startData.x);
                    const deltaY = Math.abs(touch.clientY - startData.y);
                    const duration = Date.now() - startData.timestamp;
                    
                    // 短時間で小さな移動ならタップとして処理
                    if (deltaX < 10 && deltaY < 10 && duration < 500) {
                        handleEvent(event);
                    }
                    
                    this.touchStartData.delete(touch.identifier);
                }
            }, { passive: false });
            
            // フォールバック用にclickも追加
            element.addEventListener('click', handleEvent, { passive: false });
        } else {
            // デスクトップではclickのみ
            element.addEventListener('click', handleEvent);
        }
        
        // iOS Safari専用のフォーカス処理
        if (this.isIOS) {
            element.addEventListener('touchstart', () => {
                element.focus();
            }, { passive: true });
        }
    }
    
    /**
     * タッチフィードバック効果を追加
     */
    addTouchFeedback(element) {
        if (!this.isMobile) return;
        
        // 既存のアニメーションクラスを削除
        element.classList.remove('touch-feedback');
        
        // フィードバッククラスを追加
        element.classList.add('touch-feedback');
        
        // アニメーション後にクラスを削除
        setTimeout(() => {
            element.classList.remove('touch-feedback');
        }, 150);
    }
    
    /**
     * すべてのボタンにiOS対応を適用
     */
    setupAllButtons() {
        const buttons = document.querySelectorAll('button, .btn, [role="button"]');
        
        buttons.forEach(button => {
            // 既にイベントが設定されている要素はスキップ
            if (button.dataset.touchEnabled) return;
            
            // iOS対応マークを追加
            button.dataset.touchEnabled = 'true';
            
            // 元のclickイベントを保存してiOS対応版に置き換え
            const originalOnclick = button.onclick;
            button.onclick = null;
            
            if (originalOnclick) {
                this.addTouchListener(button, originalOnclick);
            }
            
            // CSSクラス追加
            button.classList.add('touch-enabled');
        });
    }
    
    /**
     * デバッグ情報を取得
     */
    getDebugInfo() {
        return {
            isTouch: this.isTouch,
            isMobile: this.isMobile,
            isIOS: this.isIOS,
            userAgent: navigator.userAgent,
            viewport: document.querySelector('meta[name=viewport]')?.getAttribute('content'),
            activeTouches: this.touchStartData.size
        };
    }
}

// CSS用のタッチフィードバック
const touchFeedbackCSS = `
.touch-enabled {
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
    touch-action: manipulation;
}

.touch-feedback {
    transform: scale(0.95) !important;
    opacity: 0.8 !important;
    transition: all 0.1s ease !important;
}

/* iOS専用の追加スタイル */
@supports (-webkit-touch-callout: none) {
    .touch-enabled {
        -webkit-appearance: none;
        appearance: none;
    }
}
`;

// CSSを動的に追加
if (!document.getElementById('touch-helper-styles')) {
    const style = document.createElement('style');
    style.id = 'touch-helper-styles';
    style.textContent = touchFeedbackCSS;
    document.head.appendChild(style);
}

// グローバルインスタンス
export const touchHelper = new TouchHelper();