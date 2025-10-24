export class OrientationManager extends EventTarget {
    constructor() {
        super();
        this.isMonitoring = false;
        this.hasPermission = false;
        this.currentOrientation = {
            alpha: 0,  // 方位角 (0-360度)
            beta: 0,   // 前後の傾き (-180-180度)
            gamma: 0   // 左右の傾き (-90-90度)
        };
        
        // 設定値
        this.uprightThreshold = 30; // 立位判定の閾値（度）
        this.directionThreshold = 30; // 方向判定の閾値（度）
        this.targetDirection = 0; // 目標方向（北=0度）
        
        this.monitoringStartTime = null;
        this.eventHandler = this.handleDeviceOrientation.bind(this);
        
        this.checkSupport();
    }
    
    async checkSupport() {
        if (!window.DeviceOrientationEvent) {
            console.warn('DeviceOrientationEvent is not supported');
            return false;
        }
        
        // iOS 13+での権限要求
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                this.hasPermission = permission === 'granted';
                console.log('DeviceOrientation permission:', permission);
            } catch (error) {
                console.error('DeviceOrientation permission request failed:', error);
                this.hasPermission = false;
            }
        } else {
            // Android Chrome、デスクトップなど
            this.hasPermission = true;
        }
        
        return this.hasPermission;
    }
    
    async requestPermission() {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                this.hasPermission = permission === 'granted';
                return this.hasPermission;
            } catch (error) {
                console.error('Permission request failed:', error);
                return false;
            }
        }
        return this.hasPermission;
    }
    
    startMonitoring() {
        if (this.isMonitoring) return;
        
        if (!this.hasPermission) {
            console.warn('DeviceOrientation permission not granted');
            return;
        }
        
        this.isMonitoring = true;
        this.monitoringStartTime = Date.now();
        
        window.addEventListener('deviceorientation', this.eventHandler, true);
        
        this.dispatchEvent(new CustomEvent('monitoringStart'));
        console.log('Started orientation monitoring');
    }
    
    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        window.removeEventListener('deviceorientation', this.eventHandler, true);
        
        this.dispatchEvent(new CustomEvent('monitoringStop'));
        console.log('Stopped orientation monitoring');
    }
    
    handleDeviceOrientation(event) {
        if (!this.isMonitoring) return;
        
        // iOS Safariの場合、webkitCompassHeadingを使用
        const alpha = event.webkitCompassHeading !== null 
            ? 360 - event.webkitCompassHeading  // iOS: webkitCompassHeadingは逆向き
            : event.alpha;  // Android Chrome
            
        this.currentOrientation = {
            alpha: alpha !== null ? alpha : 0,
            beta: event.beta !== null ? event.beta : 0,
            gamma: event.gamma !== null ? event.gamma : 0
        };
        
        const status = this.analyzeOrientation();
        this.dispatchEvent(new CustomEvent('orientationChange', { detail: status }));
        this.dispatchEvent(new CustomEvent('statusChange', { detail: status }));
    }
    
    analyzeOrientation() {
        const { alpha, beta, gamma } = this.currentOrientation;
        
        // 立位判定：beta（前後の傾き）とgamma（左右の傾き）が小さいか
        const isUpright = this.isUprightPosition(beta, gamma);
        
        // 方向判定：alphaが目標方向に近いか
        const { isDirectionCorrect, directionName, angleDifference } = this.isCorrectDirection(alpha);
        
        return {
            isUpright,
            isDirectionCorrect,
            direction: directionName,
            angleDifference,
            rawValues: { alpha, beta, gamma },
            canComplete: isUpright && isDirectionCorrect
        };
    }
    
    isUprightPosition(beta, gamma) {
        // betaとgammaの絶対値が閾値以下なら立位と判定
        const betaAbs = Math.abs(beta);
        const gammaAbs = Math.abs(gamma);
        
        return betaAbs <= this.uprightThreshold && gammaAbs <= this.uprightThreshold;
    }
    
    isCorrectDirection(alpha) {
        if (alpha === null || alpha === undefined) {
            return {
                isDirectionCorrect: false,
                directionName: '不明',
                angleDifference: 999
            };
        }
        
        // 角度の差を計算（最短角度）
        let angleDifference = Math.abs(alpha - this.targetDirection);
        if (angleDifference > 180) {
            angleDifference = 360 - angleDifference;
        }
        
        const isDirectionCorrect = angleDifference <= this.directionThreshold;
        const directionName = this.getDirectionName(alpha);
        
        return {
            isDirectionCorrect,
            directionName,
            angleDifference
        };
    }
    
    getDirectionName(angle) {
        if (angle === null || angle === undefined) return '不明';
        
        // 角度を0-360度に正規化
        const normalizedAngle = ((angle % 360) + 360) % 360;
        
        const directions = [
            { name: '北', min: 337.5, max: 360 },
            { name: '北', min: 0, max: 22.5 },
            { name: '北東', min: 22.5, max: 67.5 },
            { name: '東', min: 67.5, max: 112.5 },
            { name: '南東', min: 112.5, max: 157.5 },
            { name: '南', min: 157.5, max: 202.5 },
            { name: '南西', min: 202.5, max: 247.5 },
            { name: '西', min: 247.5, max: 292.5 },
            { name: '北西', min: 292.5, max: 337.5 }
        ];
        
        const direction = directions.find(d => 
            normalizedAngle >= d.min && normalizedAngle < d.max
        );
        
        return direction ? direction.name : '不明';
    }
    
    setTargetDirection(angle) {
        this.targetDirection = angle;
        if (this.isMonitoring) {
            const status = this.analyzeOrientation();
            this.dispatchEvent(new CustomEvent('statusChange', { detail: status }));
        }
    }
    
    setUprightThreshold(degrees) {
        this.uprightThreshold = Math.max(5, Math.min(90, degrees));
    }
    
    setDirectionThreshold(degrees) {
        this.directionThreshold = Math.max(5, Math.min(180, degrees));
    }
    
    getCurrentOrientation() {
        return { ...this.currentOrientation };
    }
    
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            hasPermission: this.hasPermission,
            currentOrientation: this.getCurrentOrientation(),
            targetDirection: this.targetDirection,
            uprightThreshold: this.uprightThreshold,
            directionThreshold: this.directionThreshold
        };
    }
    
    getMonitoringDuration() {
        if (!this.monitoringStartTime) return 0;
        return Math.floor((Date.now() - this.monitoringStartTime) / 1000);
    }
    
    // デバッグ用：現在の方向を文字列で取得
    getDebugInfo() {
        const { alpha, beta, gamma } = this.currentOrientation;
        const status = this.analyzeOrientation();
        
        return {
            raw: `α:${alpha?.toFixed(1)}° β:${beta?.toFixed(1)}° γ:${gamma?.toFixed(1)}°`,
            analysis: `立位:${status.isUpright ? 'OK' : 'NG'} 方向:${status.direction} (${status.angleDifference.toFixed(1)}°差)`,
            canComplete: status.canComplete
        };
    }
    
    // 便利メソッド：イベントリスナー追加
    on(eventName, callback) {
        this.addEventListener(eventName, (event) => {
            if (event.detail) {
                callback(event.detail);
            } else {
                callback(event);
            }
        });
    }
}

// 権限要求のためのヘルパー関数
export async function requestOrientationPermission() {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('Orientation permission request failed:', error);
            return false;
        }
    }
    return true; // 権限不要な環境
}

// 対応チェック関数
export function isOrientationSupported() {
    return 'DeviceOrientationEvent' in window;
}

// デモ用：方向を設定するヘルパー
export const DIRECTIONS = {
    NORTH: 0,
    NORTHEAST: 45,
    EAST: 90,
    SOUTHEAST: 135,
    SOUTH: 180,
    SOUTHWEST: 225,
    WEST: 270,
    NORTHWEST: 315
};