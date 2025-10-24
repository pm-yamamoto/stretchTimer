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
        
        this.timerManager.on('complete', this.handleTimerComplete.bind(this));
        this.orientationManager.on('statusChange', this.handleOrientationChange.bind(this));
    }
    
    setupEventListeners() {
        // 設定画面切り替え
        const settingsBtn = document.getElementById('settingsBtn');
        const backBtn = document.getElementById('backBtn');
        
        settingsBtn?.addEventListener('click', () => this.showScreen('settings'));
        backBtn?.addEventListener('click', () => this.showScreen('main'));
        
        // ストレッチ完了ボタン
        const completeBtn = document.getElementById('completeBtn');
        completeBtn?.addEventListener('click', this.handleStretchComplete.bind(this));
        
        // 次のカウントダウン開始ボタン
        const nextCountdownBtn = document.getElementById('nextCountdownBtn');
        nextCountdownBtn?.addEventListener('click', this.startNewTimer.bind(this));
        
        // 設定変更イベント
        this.setupSettingsEvents();
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
        presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = parseInt(e.target.dataset.value);
                intervalSlider.value = value;
                intervalValue.textContent = value;
                this.storageManager.saveSetting('interval', value);
                this.updatePresetButtons(value);
            });
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
        
        // 通知送信
        const settings = this.storageManager.loadSettings();
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