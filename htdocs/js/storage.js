export class StorageManager {
    constructor() {
        this.prefix = 'stretchTimer_';
        this.settingsKey = `${this.prefix}settings`;
        this.historyKey = `${this.prefix}history`;
        this.statisticsKey = `${this.prefix}statistics`;
        
        // デフォルト設定
        this.defaultSettings = {
            interval: 30,           // ストレッチ間隔（分）
            notifications: true,    // 通知有効
            vibration: true,        // バイブレーション有効
            darkMode: false,        // ダークモード
            targetDirection: 0,     // 目標方向（北=0度）
            uprightThreshold: 30,   // 立位判定閾値（度）
            directionThreshold: 30, // 方向判定閾値（度）
            soundEnabled: true,     // 音響通知
            autoStart: true,        // 自動開始
            weekdaysOnly: false     // 平日のみ
        };
        
        this.checkStorageSupport();
        this.initializeSettings();
    }
    
    checkStorageSupport() {
        try {
            const testKey = `${this.prefix}test`;
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            this.isStorageSupported = true;
        } catch (error) {
            console.warn('LocalStorage is not supported or available:', error);
            this.isStorageSupported = false;
        }
    }
    
    initializeSettings() {
        if (!this.isStorageSupported) return;
        
        const settings = this.loadSettings();
        if (!settings || Object.keys(settings).length === 0) {
            this.saveSettings(this.defaultSettings);
        }
    }
    
    // 設定管理
    saveSettings(settings) {
        if (!this.isStorageSupported) return false;
        
        try {
            const currentSettings = this.loadSettings();
            const newSettings = { ...currentSettings, ...settings };
            localStorage.setItem(this.settingsKey, JSON.stringify(newSettings));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }
    
    loadSettings() {
        if (!this.isStorageSupported) return { ...this.defaultSettings };
        
        try {
            const settingsJson = localStorage.getItem(this.settingsKey);
            if (!settingsJson) return { ...this.defaultSettings };
            
            const settings = JSON.parse(settingsJson);
            return { ...this.defaultSettings, ...settings };
        } catch (error) {
            console.error('Failed to load settings:', error);
            return { ...this.defaultSettings };
        }
    }
    
    saveSetting(key, value) {
        const settings = this.loadSettings();
        settings[key] = value;
        return this.saveSettings(settings);
    }
    
    getSetting(key) {
        const settings = this.loadSettings();
        return settings[key] !== undefined ? settings[key] : this.defaultSettings[key];
    }
    
    resetSettings() {
        return this.saveSettings(this.defaultSettings);
    }
    
    // ストレッチ記録管理
    saveStretchRecord(record) {
        if (!this.isStorageSupported) return false;
        
        try {
            const history = this.loadHistory();
            const newRecord = {
                id: this.generateId(),
                timestamp: record.timestamp || new Date(),
                completed: record.completed || false,
                duration: record.duration || 0,
                orientationData: record.orientationData || null,
                intervalMinutes: record.intervalMinutes || this.getSetting('interval')
            };
            
            history.push(newRecord);
            
            // 履歴が1000件を超えたら古いものを削除
            if (history.length > 1000) {
                history.splice(0, history.length - 1000);
            }
            
            localStorage.setItem(this.historyKey, JSON.stringify(history));
            this.updateStatistics();
            
            return newRecord;
        } catch (error) {
            console.error('Failed to save stretch record:', error);
            return false;
        }
    }
    
    loadHistory() {
        if (!this.isStorageSupported) return [];
        
        try {
            const historyJson = localStorage.getItem(this.historyKey);
            return historyJson ? JSON.parse(historyJson) : [];
        } catch (error) {
            console.error('Failed to load history:', error);
            return [];
        }
    }
    
    getLastRecord() {
        const history = this.loadHistory();
        return history.length > 0 ? history[history.length - 1] : null;
    }
    
    getRecordsByDate(date) {
        const history = this.loadHistory();
        const targetDate = new Date(date).toDateString();
        
        return history.filter(record => 
            new Date(record.timestamp).toDateString() === targetDate
        );
    }
    
    getRecordsByDateRange(startDate, endDate) {
        const history = this.loadHistory();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return history.filter(record => {
            const recordDate = new Date(record.timestamp);
            return recordDate >= start && recordDate <= end;
        });
    }
    
    deleteRecord(recordId) {
        if (!this.isStorageSupported) return false;
        
        try {
            const history = this.loadHistory();
            const updatedHistory = history.filter(record => record.id !== recordId);
            localStorage.setItem(this.historyKey, JSON.stringify(updatedHistory));
            this.updateStatistics();
            return true;
        } catch (error) {
            console.error('Failed to delete record:', error);
            return false;
        }
    }
    
    clearHistory() {
        if (!this.isStorageSupported) return false;
        
        try {
            localStorage.removeItem(this.historyKey);
            this.updateStatistics();
            return true;
        } catch (error) {
            console.error('Failed to clear history:', error);
            return false;
        }
    }
    
    // 統計データ管理
    updateStatistics() {
        if (!this.isStorageSupported) return;
        
        const history = this.loadHistory();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const statistics = {
            total: {
                count: history.length,
                completed: history.filter(r => r.completed).length,
                completionRate: 0
            },
            today: {
                count: 0,
                completed: 0,
                completionRate: 0
            },
            thisWeek: {
                count: 0,
                completed: 0,
                completionRate: 0
            },
            thisMonth: {
                count: 0,
                completed: 0,
                completionRate: 0
            },
            streak: {
                current: 0,
                longest: 0
            },
            averageDuration: 0,
            lastUpdated: now
        };
        
        // 今日の統計
        const todayRecords = history.filter(r => 
            new Date(r.timestamp) >= today
        );
        statistics.today.count = todayRecords.length;
        statistics.today.completed = todayRecords.filter(r => r.completed).length;
        
        // 今週の統計
        const thisWeekRecords = history.filter(r => 
            new Date(r.timestamp) >= thisWeek
        );
        statistics.thisWeek.count = thisWeekRecords.length;
        statistics.thisWeek.completed = thisWeekRecords.filter(r => r.completed).length;
        
        // 今月の統計
        const thisMonthRecords = history.filter(r => 
            new Date(r.timestamp) >= thisMonth
        );
        statistics.thisMonth.count = thisMonthRecords.length;
        statistics.thisMonth.completed = thisMonthRecords.filter(r => r.completed).length;
        
        // 完了率計算
        statistics.total.completionRate = statistics.total.count > 0 
            ? (statistics.total.completed / statistics.total.count * 100) 
            : 0;
        statistics.today.completionRate = statistics.today.count > 0 
            ? (statistics.today.completed / statistics.today.count * 100) 
            : 0;
        statistics.thisWeek.completionRate = statistics.thisWeek.count > 0 
            ? (statistics.thisWeek.completed / statistics.thisWeek.count * 100) 
            : 0;
        statistics.thisMonth.completionRate = statistics.thisMonth.count > 0 
            ? (statistics.thisMonth.completed / statistics.thisMonth.count * 100) 
            : 0;
        
        // 平均継続時間
        const completedRecords = history.filter(r => r.completed && r.duration > 0);
        statistics.averageDuration = completedRecords.length > 0
            ? completedRecords.reduce((sum, r) => sum + r.duration, 0) / completedRecords.length
            : 0;
        
        // 連続記録計算
        statistics.streak = this.calculateStreak(history);
        
        try {
            localStorage.setItem(this.statisticsKey, JSON.stringify(statistics));
        } catch (error) {
            console.error('Failed to save statistics:', error);
        }
    }
    
    calculateStreak(history) {
        const completedRecords = history
            .filter(r => r.completed)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (completedRecords.length === 0) {
            return { current: 0, longest: 0 };
        }
        
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        let lastDate = null;
        
        // 日付別にグループ化
        const dateGroups = {};
        completedRecords.forEach(record => {
            const date = new Date(record.timestamp).toDateString();
            if (!dateGroups[date]) {
                dateGroups[date] = [];
            }
            dateGroups[date].push(record);
        });
        
        const dates = Object.keys(dateGroups).sort((a, b) => new Date(b) - new Date(a));
        const today = new Date().toDateString();
        
        // 現在の連続記録を計算
        for (let i = 0; i < dates.length; i++) {
            const currentDate = dates[i];
            
            if (i === 0) {
                // 最新の記録が今日または昨日なら連続記録開始
                const daysDiff = Math.floor((new Date(today) - new Date(currentDate)) / (24 * 60 * 60 * 1000));
                if (daysDiff <= 1) {
                    currentStreak = 1;
                }
            } else {
                const prevDate = dates[i - 1];
                const daysDiff = Math.floor((new Date(prevDate) - new Date(currentDate)) / (24 * 60 * 60 * 1000));
                
                if (daysDiff === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }
        
        // 最長連続記録を計算
        tempStreak = 1;
        longestStreak = 1;
        
        for (let i = 1; i < dates.length; i++) {
            const currentDate = dates[i];
            const prevDate = dates[i - 1];
            const daysDiff = Math.floor((new Date(prevDate) - new Date(currentDate)) / (24 * 60 * 60 * 1000));
            
            if (daysDiff === 1) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 1;
            }
        }
        
        return {
            current: currentStreak,
            longest: Math.max(longestStreak, currentStreak)
        };
    }
    
    loadStatistics() {
        if (!this.isStorageSupported) {
            return this.getEmptyStatistics();
        }
        
        try {
            const statisticsJson = localStorage.getItem(this.statisticsKey);
            return statisticsJson ? JSON.parse(statisticsJson) : this.getEmptyStatistics();
        } catch (error) {
            console.error('Failed to load statistics:', error);
            return this.getEmptyStatistics();
        }
    }
    
    getEmptyStatistics() {
        return {
            total: { count: 0, completed: 0, completionRate: 0 },
            today: { count: 0, completed: 0, completionRate: 0 },
            thisWeek: { count: 0, completed: 0, completionRate: 0 },
            thisMonth: { count: 0, completed: 0, completionRate: 0 },
            streak: { current: 0, longest: 0 },
            averageDuration: 0,
            lastUpdated: new Date()
        };
    }
    
    // データエクスポート/インポート
    exportData() {
        if (!this.isStorageSupported) return null;
        
        try {
            return {
                settings: this.loadSettings(),
                history: this.loadHistory(),
                statistics: this.loadStatistics(),
                exportDate: new Date(),
                version: '1.0'
            };
        } catch (error) {
            console.error('Failed to export data:', error);
            return null;
        }
    }
    
    importData(data) {
        if (!this.isStorageSupported || !data) return false;
        
        try {
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            
            if (data.history) {
                localStorage.setItem(this.historyKey, JSON.stringify(data.history));
            }
            
            this.updateStatistics();
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }
    
    // ユーティリティ
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    getStorageUsage() {
        if (!this.isStorageSupported) return null;
        
        try {
            let totalSize = 0;
            const sizes = {};
            
            const keys = [this.settingsKey, this.historyKey, this.statisticsKey];
            keys.forEach(key => {
                const data = localStorage.getItem(key);
                const size = data ? new Blob([data]).size : 0;
                sizes[key] = size;
                totalSize += size;
            });
            
            return {
                total: totalSize,
                breakdown: sizes,
                totalMB: (totalSize / 1024 / 1024).toFixed(2)
            };
        } catch (error) {
            console.error('Failed to calculate storage usage:', error);
            return null;
        }
    }
    
    clearAllData() {
        if (!this.isStorageSupported) return false;
        
        try {
            localStorage.removeItem(this.settingsKey);
            localStorage.removeItem(this.historyKey);
            localStorage.removeItem(this.statisticsKey);
            this.initializeSettings();
            return true;
        } catch (error) {
            console.error('Failed to clear all data:', error);
            return false;
        }
    }
}