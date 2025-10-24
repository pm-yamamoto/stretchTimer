import { TimerManager } from './timer.js';
import { OrientationManager } from './orientation.js';
import { NotificationManager } from './notification.js';
import { StorageManager } from './storage.js';
import { PWAManager } from './pwa.js';

class StretchTimerApp {
    constructor() {
        this.storageManager = new StorageManager();
        this.timerManager = new TimerManager();
        this.orientationManager = new OrientationManager();
        this.notificationManager = new NotificationManager();
        this.pwaManager = new PWAManager();
        
        this.currentScreen = 'main';
        this.isStretchCompleted = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.updateUI();
        this.startInitialTimer();
        
        // iPhone実機テスト用デバッグ
        this.setupDebugInfo();
        
        this.timerManager.on('complete', this.handleTimerComplete.bind(this));
        this.orientationManager.on('statusChange', this.handleOrientationChange.bind(this));
        
        // 設定から方向を読み込み、OrientationManagerに適用
        this.applyOrientationSettings();
    }
    
    setupDebugInfo() {
        // iPhone実機での動作確認用
        console.log('=== iPhone実機デバッグ情報 ===');
        console.log('User Agent:', navigator.userAgent);
        console.log('Touch Events:', 'ontouchstart' in window);
        console.log('Viewport Size:', window.innerWidth, 'x', window.innerHeight);
        console.log('Device Pixel Ratio:', window.devicePixelRatio);
        
        // タッチイベントテスト用の視覚的フィードバック
        document.addEventListener('touchstart', () => {
            console.log('Touch Start detected');
            document.body.style.backgroundColor = '#E8F5E8';
            setTimeout(() => {
                document.body.style.backgroundColor = '';
            }, 100);
        }, { passive: true });
    }
    
    setupEventListeners() {
        // iOS実機対応：シンプルなイベントリスナー
        this.addIOSEventListener('settingsBtn', () => this.showScreen('settings'));
        this.addIOSEventListener('backBtn', () => this.showScreen('main'));
        this.addIOSEventListener('completeBtn', this.handleStretchComplete.bind(this));
        this.addIOSEventListener('nextCountdownBtn', this.startNewTimer.bind(this));
        
        // 設定変更イベント
        this.setupSettingsEvents();
    }
    
    // iPhone実機で確実に動作するイベントリスナー
    addIOSEventListener(elementId, handler) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // 複数のイベントを同時に登録（iPhone実機対応）
        const events = ['click', 'touchend'];
        let handled = false;
        
        const wrappedHandler = (event) => {
            // 重複実行防止
            if (handled) {
                handled = false;
                return;
            }
            handled = true;
            setTimeout(() => { handled = false; }, 300);
            
            event.preventDefault();
            event.stopPropagation();
            
            try {
                handler(event);
            } catch (error) {
                console.error('Event handler error:', error);
            }
        };
        
        events.forEach(eventType => {
            element.addEventListener(eventType, wrappedHandler, {
                passive: false
            });
        });
        
        console.log(`Event listeners added to ${elementId}:`, events);
        
        // iPhone実機テスト用：ボタンに視覚的フィードバックを追加
        element.style.transition = 'all 0.1s ease';
        element.addEventListener('touchstart', () => {
            element.style.backgroundColor = '#45a049';
            element.style.transform = 'scale(0.95)';
        }, { passive: true });
        
        element.addEventListener('touchend', () => {
            setTimeout(() => {
                element.style.backgroundColor = '';
                element.style.transform = '';
            }, 100);
        }, { passive: true });
    }
    
    // 要素に直接イベントリスナーを追加（プリセットボタン用）
    addIOSEventListenerToElement(element, handler) {
        if (!element) return;
        
        const events = ['click', 'touchend'];
        let handled = false;
        
        const wrappedHandler = (event) => {
            if (handled) {
                handled = false;
                return;
            }
            handled = true;
            setTimeout(() => { handled = false; }, 300);
            
            event.preventDefault();
            event.stopPropagation();
            
            try {
                handler(event);
            } catch (error) {
                console.error('Event handler error:', error);
            }
        };
        
        events.forEach(eventType => {
            element.addEventListener(eventType, wrappedHandler, {
                passive: false
            });
        });
    }
    
    setupSettingsEvents() {
        // 間隔スライダー
        const intervalSlider = document.getElementById('intervalSlider');
        const intervalValue = document.getElementById('intervalValue');
        
        intervalSlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            intervalValue.textContent = value;
            this.storageManager.saveSetting('interval', value);
        });
        
        // プリセットボタン
        const presetButtons = document.querySelectorAll('.preset-btn');
        presetButtons.forEach((btn, index) => {
            this.addIOSEventListenerToElement(btn, (e) => {
                const value = parseInt(e.target.dataset.value);
                intervalSlider.value = value;
                intervalValue.textContent = value;
                this.storageManager.saveSetting('interval', value);
                this.updatePresetButtons(value);
            });
            console.log(`Preset button ${index} (${btn.dataset.value}min) event listener added`);
        });
        
        // 方向設定
        const directionSelect = document.getElementById('directionSelect');
        directionSelect?.addEventListener('change', (e) => {
            const direction = parseInt(e.target.value);
            this.storageManager.saveSetting('targetDirection', direction);
            this.orientationManager.setTargetDirection(direction);
            console.log('Target direction changed to:', direction);
        });
        
        // 通知設定
        const notificationToggle = document.getElementById('notificationToggle');
        const vibrationToggle = document.getElementById('vibrationToggle');
        const darkModeToggle = document.getElementById('darkModeToggle');
        
        notificationToggle?.addEventListener('change', (e) => {
            this.storageManager.saveSetting('notifications', e.target.checked);
            if (e.target.checked) {
                this.notificationManager.requestPermission();
            }
        });
        
        vibrationToggle?.addEventListener('change', (e) => {
            this.storageManager.saveSetting('vibration', e.target.checked);
        });
        
        darkModeToggle?.addEventListener('change', (e) => {
            this.storageManager.saveSetting('darkMode', e.target.checked);
            this.toggleDarkMode(e.target.checked);
        });
        
        // デバッグモード設定
        this.setupDebugControls();
    }
    
    setupDebugControls() {
        const debugModeToggle = document.getElementById('debugModeToggle');
        const debugControls = document.getElementById('debugControls');
        const manualOrientationToggle = document.getElementById('manualOrientationToggle');
        const manualOrientation = document.getElementById('manualOrientation');
        const debugInfo = document.getElementById('debugInfo');
        
        // デバッグモード切り替え
        debugModeToggle?.addEventListener('change', (e) => {
            debugControls.style.display = e.target.checked ? 'block' : 'none';
            this.orientationManager.setDebugging(e.target.checked);
            console.log('Debug mode:', e.target.checked);
        });
        
        // 手動入力モード切り替え
        manualOrientationToggle?.addEventListener('change', (e) => {
            manualOrientation.style.display = e.target.checked ? 'block' : 'none';
            this.orientationManager.setManualMode(e.target.checked);
            
            if (e.target.checked) {
                // 手動モード有効時：スライダーの値でOrientationManagerを更新
                this.updateManualOrientation();
            }
        });
        
        // 手動入力スライダーのイベント設定
        this.setupManualOrientationSliders();
        
        // デバッグ情報の定期更新
        if (debugInfo) {
            setInterval(() => {
                this.updateDebugInfo();
            }, 100);
        }
    }
    
    setupManualOrientationSliders() {
        const sliders = ['manualAlpha', 'manualBeta', 'manualGamma'];
        const valueSpans = ['manualAlphaValue', 'manualBetaValue', 'manualGammaValue'];
        
        sliders.forEach((sliderId, index) => {
            const slider = document.getElementById(sliderId);
            const valueSpan = document.getElementById(valueSpans[index]);
            
            slider?.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueSpan.textContent = value;
                this.updateManualOrientation();
            });
        });
    }
    
    updateManualOrientation() {
        const alpha = parseFloat(document.getElementById('manualAlpha')?.value || 0);
        const beta = parseFloat(document.getElementById('manualBeta')?.value || 0);
        const gamma = parseFloat(document.getElementById('manualGamma')?.value || 0);
        
        this.orientationManager.setManualOrientation(alpha, beta, gamma);
    }
    
    updateDebugInfo() {
        const debugInfo = document.getElementById('debugInfo');
        if (!debugInfo) return;
        
        const orientation = this.orientationManager.getCurrentOrientation();
        const status = this.orientationManager.analyzeOrientation();
        const isManualMode = this.orientationManager.isManualMode;
        
        const alpha = orientation.alpha?.toFixed(1) || '0.0';
        const beta = orientation.beta?.toFixed(1) || '0.0';
        const gamma = orientation.gamma?.toFixed(1) || '0.0';
        
        const uprightStatus = status.isUpright ? '✓ OK' : '✗ NG';
        const directionStatus = status.isDirectionCorrect ? '✓ OK' : '✗ NG';
        
        // 目標方向の名前を取得
        const settings = this.storageManager.loadSettings();
        const targetDirection = settings.targetDirection || 0;
        const directionNames = {0: '北', 90: '東', 180: '南', 270: '西'};
        const targetDirectionName = directionNames[targetDirection] || '不明';
        
        const modeText = isManualMode ? '手動入力' : 'デバイスセンサー';
        const timestamp = new Date().toLocaleTimeString();
        
        debugInfo.innerHTML = `
            <strong>[${timestamp}] DeviceOrientation</strong><br>
            モード: ${modeText}<br>
            現在値: α=${alpha}° β=${beta}° γ=${gamma}°<br>
            立位判定: ${uprightStatus} (閾値±30°)<br>
            方向判定: ${status.direction} ${directionStatus}<br>
            目標方向: ${targetDirectionName} (${targetDirection}°)<br>
            角度差: ${status.angleDifference?.toFixed(1)}°<br>
            完了可能: ${status.canComplete ? '✓ はい' : '✗ いいえ'}
        `;
    }
    
    applyOrientationSettings() {
        const settings = this.storageManager.loadSettings();
        const targetDirection = settings.targetDirection || 0;
        this.orientationManager.setTargetDirection(targetDirection);
        console.log('Applied target direction:', targetDirection);
        
        // 方向名を表示
        const directionNames = {0: '北', 90: '東', 180: '南', 270: '西'};
        const directionName = directionNames[targetDirection] || '不明';
        console.log(`Target direction set to: ${directionName} (${targetDirection}°)`);
    }
    
    loadSettings() {
        const settings = this.storageManager.loadSettings();
        
        // 間隔設定
        const intervalSlider = document.getElementById('intervalSlider');
        const intervalValue = document.getElementById('intervalValue');
        if (intervalSlider && intervalValue) {
            intervalSlider.value = settings.interval;
            intervalValue.textContent = settings.interval;
            this.updatePresetButtons(settings.interval);
        }
        
        // 方向設定
        const directionSelect = document.getElementById('directionSelect');
        if (directionSelect) {
            directionSelect.value = settings.targetDirection || 0;
        }
        
        // 通知設定
        const notificationToggle = document.getElementById('notificationToggle');
        const vibrationToggle = document.getElementById('vibrationToggle');
        const darkModeToggle = document.getElementById('darkModeToggle');
        
        if (notificationToggle) notificationToggle.checked = settings.notifications;
        if (vibrationToggle) vibrationToggle.checked = settings.vibration;
        if (darkModeToggle) darkModeToggle.checked = settings.darkMode;
        
        // ダークモード適用
        if (settings.darkMode) {
            this.toggleDarkMode(true);
        }
    }
    
    updatePresetButtons(currentValue) {
        const presetButtons = document.querySelectorAll('.preset-btn');
        presetButtons.forEach(btn => {
            const value = parseInt(btn.dataset.value);
            btn.classList.toggle('btn--primary', value === currentValue);
            btn.classList.toggle('btn--outline', value !== currentValue);
        });
    }
    
    toggleDarkMode(isDark) {
        document.body.classList.toggle('dark-theme', isDark);
    }
    
    showScreen(screenName) {
        const screens = document.querySelectorAll('.main-screen, .stretch-screen, .settings-screen');
        screens.forEach(screen => {
            screen.style.display = 'none';
        });
        
        const targetScreen = document.getElementById(`${screenName}Screen`);
        if (targetScreen) {
            targetScreen.style.display = 'block';
            this.currentScreen = screenName;
        }
    }
    
    startInitialTimer() {
        const settings = this.storageManager.loadSettings();
        this.timerManager.start(settings.interval * 60); // 分を秒に変換
    }
    
    startNewTimer() {
        const settings = this.storageManager.loadSettings();
        this.timerManager.start(settings.interval * 60);
        this.showScreen('main');
        this.isStretchCompleted = false;
        this.updateStretchUI();
    }
    
    handleTimerComplete() {
        this.showScreen('stretch');
        this.orientationManager.startMonitoring();
        
        // Chrome DevTools での確認用ログ
        const settings = this.storageManager.loadSettings();
        const directionNames = {0: '北', 90: '東', 180: '南', 270: '西'};
        const targetDirectionName = directionNames[settings.targetDirection || 0] || '不明';
        
        console.log('=== ストレッチ開始 ===');
        console.log('目標方向:', targetDirectionName, `(${settings.targetDirection || 0}°)`);
        console.log('Chrome DevTools > Sensors で alpha値を設定してテスト可能');
        
        // 通知送信
        if (settings.notifications) {
            this.notificationManager.showNotification(
                'ストレッチの時間です！',
                '立位になって指定の方向を向いてください。'
            );
        }
        
        if (settings.vibration && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    }
    
    handleOrientationChange(status) {
        this.updateOrientationUI(status);
        this.updateCompleteButton(status);
    }
    
    updateOrientationUI(status) {
        // 立位状態表示
        const uprightStatus = document.getElementById('uprightStatus');
        const uprightIcon = document.getElementById('uprightIcon');
        
        if (uprightStatus && uprightIcon) {
            const uprightText = uprightStatus.querySelector('.status-item__text');
            if (status.isUpright) {
                uprightIcon.className = 'status-item__icon status-item__icon--success';
                uprightIcon.textContent = '✓';
                uprightText.textContent = '立位検知済み';
            } else {
                uprightIcon.className = 'status-item__icon status-item__icon--inactive';
                uprightIcon.textContent = '●';
                uprightText.textContent = '立位検知待ち';
            }
        }
        
        // 方向状態表示
        const directionStatus = document.getElementById('directionStatus');
        const directionIcon = document.getElementById('directionIcon');
        const currentDirection = document.getElementById('currentDirection');
        
        if (directionStatus && directionIcon && currentDirection) {
            const directionText = directionStatus.querySelector('.status-item__text');
            currentDirection.textContent = status.direction;
            
            if (status.isDirectionCorrect) {
                directionIcon.className = 'status-item__icon status-item__icon--success';
                directionIcon.textContent = '✓';
                directionText.innerHTML = `方向一致 (<span id="currentDirection">${status.direction}</span>)`;
            } else {
                directionIcon.className = 'status-item__icon status-item__icon--warning';
                directionIcon.textContent = '●';
                directionText.innerHTML = `方向不一致 (<span id="currentDirection">${status.direction}</span>)`;
            }
        }
    }
    
    updateCompleteButton(status) {
        const completeBtn = document.getElementById('completeBtn');
        if (!completeBtn) return;
        
        const canComplete = status.isUpright && status.isDirectionCorrect;
        
        completeBtn.disabled = !canComplete;
        completeBtn.className = canComplete 
            ? 'btn btn--primary' 
            : 'btn btn--primary btn--disabled';
    }
    
    handleStretchComplete() {
        if (this.isStretchCompleted) return;
        
        // 完了記録
        const completionTime = new Date();
        this.storageManager.saveStretchRecord({
            timestamp: completionTime,
            completed: true,
            duration: this.orientationManager.getMonitoringDuration()
        });
        
        this.isStretchCompleted = true;
        this.orientationManager.stopMonitoring();
        
        // 成功フィードバック
        const settings = this.storageManager.loadSettings();
        if (settings.vibration && 'vibrate' in navigator) {
            navigator.vibrate([100, 50, 100, 50, 200]);
        }
        
        // 最終記録更新
        this.updateLastRecord(completionTime);
        
        // 新しいタイマー開始
        setTimeout(() => {
            this.startNewTimer();
        }, 2000);
    }
    
    updateLastRecord(timestamp) {
        const lastRecordElements = document.querySelectorAll('#lastRecord');
        const timeString = timestamp.toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        lastRecordElements.forEach(element => {
            element.textContent = timeString;
        });
    }
    
    updateUI() {
        this.timerManager.on('tick', (remaining) => {
            this.updateTimerDisplay(remaining);
            this.updateProgress(remaining);
            this.updateNextTime(remaining);
        });
        
        // 最終記録読み込み
        const lastRecord = this.storageManager.getLastRecord();
        if (lastRecord) {
            this.updateLastRecord(new Date(lastRecord.timestamp));
        }
    }
    
    updateTimerDisplay(remaining) {
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timerDisplays = document.querySelectorAll('#timerDisplay, #stretchTimerDisplay');
        timerDisplays.forEach(display => {
            display.textContent = timeString;
        });
        
        // ストレッチ画面のタイマー残り表示
        const timerRemaining = document.getElementById('timerRemaining');
        if (timerRemaining && this.currentScreen === 'stretch') {
            timerRemaining.textContent = timeString;
        }
    }
    
    updateProgress(remaining) {
        const settings = this.storageManager.loadSettings();
        const total = settings.interval * 60;
        const progress = ((total - remaining) / total) * 100;
        
        const progressBars = document.querySelectorAll('#progressBar, #stretchProgressBar');
        progressBars.forEach(bar => {
            bar.style.width = `${Math.max(0, progress)}%`;
        });
    }
    
    updateNextTime(remaining) {
        const nextTime = new Date(Date.now() + remaining * 1000);
        const timeString = nextTime.toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        
        const nextTimeElements = document.querySelectorAll('#nextTime, #stretchNextTime');
        nextTimeElements.forEach(element => {
            element.textContent = timeString;
        });
    }
    
    updateStretchUI() {
        const completeBtn = document.getElementById('completeBtn');
        if (completeBtn) {
            completeBtn.disabled = true;
            completeBtn.className = 'btn btn--primary btn--disabled';
        }
        
        // 状態アイコンをリセット
        const uprightIcon = document.getElementById('uprightIcon');
        const directionIcon = document.getElementById('directionIcon');
        
        if (uprightIcon) {
            uprightIcon.className = 'status-item__icon status-item__icon--inactive';
            uprightIcon.textContent = '●';
        }
        
        if (directionIcon) {
            directionIcon.className = 'status-item__icon status-item__icon--inactive';
            directionIcon.textContent = '●';
        }
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    new StretchTimerApp();
});