# ストレッチタイマーPWA 技術仕様書

## 1. システム概要

### 1.1 アーキテクチャ
- **アーキテクチャパターン**: SPA（Single Page Application）
- **フロントエンド**: Vanilla JavaScript + CSS3 + HTML5
- **状態管理**: LocalStorage + インメモリ状態管理
- **通信**: Web API（DeviceOrientation, Notification等）

### 1.2 技術スタック
- **言語**: HTML5, CSS3, JavaScript (ES2020+)
- **PWA**: Web App Manifest, Service Worker
- **API**: DeviceOrientationAPI, Notification API, Vibration API
- **ストレージ**: LocalStorage
- **ビルドツール**: なし（Vanilla環境）

## 2. システム構成

### 2.1 ディレクトリ構成
```
htdocs/
├── index.html              # メインHTML
├── manifest.json           # PWAマニフェスト
├── sw.js                  # Service Worker
├── css/
│   ├── style.css          # メインスタイル
│   ├── responsive.css     # レスポンシブ対応
│   └── dark-theme.css     # ダークモード
├── js/
│   ├── app.js             # メインアプリケーション
│   ├── timer.js           # タイマー機能
│   ├── orientation.js     # デバイス向き検出
│   ├── notification.js    # 通知機能
│   ├── storage.js         # ストレージ管理
│   └── pwa.js             # PWA機能
└── icons/
    ├── icon-192.png       # PWAアイコン (192x192)
    ├── icon-512.png       # PWAアイコン (512x512)
    └── favicon.ico        # ファビコン
```

### 2.2 主要コンポーネント

#### 2.2.1 App Controller (app.js)
- アプリケーション全体の状態管理
- 画面遷移制御
- イベントハンドリングの統合

```javascript
class StretchTimer {
    constructor() {
        this.state = {
            isRunning: false,
            timeRemaining: 0,
            settings: {},
            stretchMode: false
        }
        this.init()
    }
    
    init() {
        // 初期化処理
    }
    
    startTimer(duration) {
        // タイマー開始
    }
    
    showStretchScreen() {
        // ストレッチ画面表示
    }
}
```

#### 2.2.2 Timer Manager (timer.js)
- タイマー機能の実装
- バックグラウンド実行対応

```javascript
class TimerManager {
    constructor() {
        this.intervalId = null
        this.startTime = null
        this.duration = 0
    }
    
    start(duration, callback) {
        // タイマー開始
    }
    
    pause() {
        // 一時停止
    }
    
    resume() {
        // 再開
    }
    
    getRemainingTime() {
        // 残り時間取得
    }
}
```

#### 2.2.3 Orientation Manager (orientation.js)
- デバイス向き検出
- 立位・方向判定ロジック

```javascript
class OrientationManager {
    constructor() {
        this.isListening = false
        this.currentOrientation = {}
        this.targetCompass = 0 // 目標方位角（北を0度とした方位角）
        this.compassThreshold = 30 // 方位許容誤差
        this.uprightThreshold = 30 // 立位許容誤差
        this.status = {
            isUpright: false, // 立位状態
            isDirectionCorrect: false, // 方向一致状態
            currentDirection: null // 現在の方位
        }
    }
    
    startListening(callback) {
        // 向き検出開始
    }
    
    stopListening() {
        // 向き検出終了
    }
    
    checkUpright(orientation) {
        // 立位状態判定（beta、gammaで縦持ち状態を判定）
    }
    
    checkDirection(orientation) {
        // 方向判定（alphaでコンパス方位を判定）
    }
    
    getDirectionName(angle) {
        // 方位角を方角名に変換（例：90° → 「東」）
    }
    
    getBothConditionsMet() {
        // 両条件満足状態を返す
        return this.status.isUpright && this.status.isDirectionCorrect
    }
}
```

#### 2.2.4 Notification Manager (notification.js)
- 通知権限管理
- 通知表示制御

```javascript
class NotificationManager {
    constructor() {
        this.permission = Notification.permission
    }
    
    async requestPermission() {
        // 通知権限要求
    }
    
    showNotification(title, options) {
        // 通知表示
    }
    
    showStretchReminder() {
        // ストレッチ通知
    }
}
```

#### 2.2.5 Storage Manager (storage.js)
- LocalStorage操作
- 設定データ管理

```javascript
class StorageManager {
    constructor() {
        this.storageKey = 'stretchTimer'
    }
    
    saveSettings(settings) {
        // 設定保存
    }
    
    loadSettings() {
        // 設定読み込み
    }
    
    saveHistory(record) {
        // 履歴保存
    }
    
    getHistory() {
        // 履歴取得
    }
}
```

## 3. API仕様

### 3.1 DeviceOrientationAPI
```javascript
// イベント登録
window.addEventListener('deviceorientation', (event) => {
    const orientation = {
        alpha: event.alpha, // Z軸回転 (0-360°) - コンパス方位
        beta: event.beta,   // X軸回転 (-180 to 180°) - 前後傾き
        gamma: event.gamma  // Y軸回転 (-90 to 90°) - 左右傾き
    }
    
    // 立位判定: betaが0°近く、gammaが0°近く
    const isUpright = Math.abs(orientation.beta) < 30 && Math.abs(orientation.gamma) < 30
    
    // 方向判定: alphaで目標方位との差を計算
    const targetDirection = 90 // 東方向を例とする
    const angleDiff = Math.abs(orientation.alpha - targetDirection)
    const isDirectionCorrect = angleDiff < 30 || angleDiff > 330
})

// iOS 13+での権限要求
if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    const permission = await DeviceOrientationEvent.requestPermission()
    if (permission === 'granted') {
        // イベントリスナー登録
    }
}
```

### 3.2 Notification API
```javascript
// 権限要求
const permission = await Notification.requestPermission()

// 通知表示
const notification = new Notification('ストレッチの時間です!', {
    body: 'スマホを持って立ち上がりましょう',
    icon: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    requireInteraction: true
})
```

### 3.3 Service Worker API
```javascript
// Service Worker登録
navigator.serviceWorker.register('/sw.js')

// メッセージ送信
navigator.serviceWorker.controller.postMessage({
    type: 'SET_TIMER',
    duration: 1800000 // 30分
})
```

## 4. データ設計

### 4.1 LocalStorage Schema

#### 4.1.1 設定データ
```json
{
    "settings": {
        "timerInterval": 30,          // 分
        "notificationEnabled": true,
        "vibrationEnabled": true,
        "soundEnabled": false,
        "darkMode": false,
        "orientationThreshold": 30    // 度
    }
}
```

#### 4.1.2 履歴データ
```json
{
    "history": [
        {
            "id": "uuid",
            "timestamp": "2024-01-01T10:30:00.000Z",
            "duration": 30,              // 分
            "completed": true,
            "completionTime": "2024-01-01T10:32:15.000Z"
        }
    ]
}
```

#### 4.1.3 統計データ
```json
{
    "statistics": {
        "totalSessions": 150,
        "completedSessions": 120,
        "completionRate": 0.8,
        "weeklyStats": [
            {
                "week": "2024-W01",
                "completed": 12,
                "total": 15
            }
        ]
    }
}
```

## 5. PWA仕様

### 5.1 Web App Manifest (manifest.json)
```json
{
    "name": "ストレッチタイマー",
    "short_name": "ストレッチ",
    "description": "定期的なストレッチを促進するタイマーアプリ",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#4CAF50",
    "orientation": "portrait-primary",
    "icons": [
        {
            "src": "/icons/icon-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "/icons/icon-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable"
        }
    ]
}
```

### 5.2 Service Worker (sw.js)
```javascript
const CACHE_NAME = 'stretch-timer-v1'
const urlsToCache = [
    '/',
    '/css/style.css',
    '/js/app.js',
    '/icons/icon-192.png'
]

// インストール
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    )
})

// フェッチ
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    )
})
```

## 6. UI/UX設計

### 6.1 画面構成

#### 6.1.1 メイン画面
- タイマー表示エリア
- 残り時間表示（円形プログレスバー）
- 設定ボタン
- 一時停止/再開ボタン
- ステータス表示

#### 6.1.2 設定画面
- 間隔時間スライダー
- プリセットボタン（30, 60, 90, 120分）
- 通知設定トグル
- ダークモード切り替え
- 履歴表示ボタン

#### 6.1.3 ストレッチ画面

**上部セクション**
- 「NEXT STRETCH IN」ヘッダー
- 大きなタイマー表示（HH:MM:SS形式）
- 次回予定時刻表示（例：「次回予定時刻: 18:24:30」）
- プログレスバー
- ステータスメッセージ（例：「タイマー作動中、完了までお待ちください」）
- 「次のカウントダウンを開始」リンクボタン
- 「最終記録: 未記録」ステータス

**完了アクションセクション**
- 「完了アクション」タイトル
- 理由説明テキスト（「タイマー完了後、立位と方向が一致すると「完了」ボタンが有効になります。」）

**状態表示エリア**
1. **タイマー残り時間表示**
   - 「タイマー残り 00:02:13」
   - グレードットアイコン付き

2. **立位検知ステータス**
   - 成功時: 緑色チェックマーク + 「立位検知済み」
   - 未検知時: グレーディスク + 「立位未検知」

3. **方向検知ステータス**
   - 不一致時: オレンジ色点 + 「方向不一致 (東)」
   - 一致時: 緑色チェックマーク + 「方向一致」

**完了ボタン**
- 「ストレッチ完了を記録」ボタン
- 条件未満時: グレーアウトして無効化
- 条件満足時: 青色で有効化、タップ可能

### 6.2 CSS設計

#### 6.2.1 カラーパレット
```css
:root {
    --primary-color: #4CAF50;
    --secondary-color: #FFC107;
    --error-color: #F44336;
    --warning-color: #FF9800;
    --info-color: #2196F3;
    --success-color: #4CAF50;
    
    --text-primary: #212121;
    --text-secondary: #757575;
    --divider: #BDBDBD;
    
    --background: #FFFFFF;
    --surface: #F5F5F5;
}

[data-theme="dark"] {
    --text-primary: #FFFFFF;
    --text-secondary: #B0B0B0;
    --divider: #424242;
    
    --background: #121212;
    --surface: #1E1E1E;
}
```

#### 6.2.2 レスポンシブブレイクポイント
```css
/* Mobile First */
.container {
    width: 100%;
    padding: 16px;
}

/* Tablet */
@media (min-width: 768px) {
    .container {
        max-width: 600px;
        margin: 0 auto;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .container {
        max-width: 800px;
    }
}
```

## 7. セキュリティ仕様

### 7.1 Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    connect-src 'self';
">
```

### 7.2 権限管理
- 通知権限: ユーザーの明示的な許可が必要
- デバイス向き: iOS 13+では明示的な許可が必要
- 位置情報: 使用しない
- カメラ/マイク: 使用しない

## 8. パフォーマンス仕様

### 8.1 読み込み最適化
- Critical CSS インライン化
- 画像の最適化（WebP対応）
- JavaScript の遅延読み込み
- Service Worker によるキャッシュ

### 8.2 実行時最適化
- タイマーの効率的な実装（requestAnimationFrame使用）
- DOM操作の最小化
- イベントリスナーの適切な管理
- メモリリークの防止

## 9. テスト仕様

### 9.1 単体テスト
- タイマー機能のテスト
- ストレージ機能のテスト
- 向き検出ロジックのテスト

### 9.2 統合テスト
- PWA機能のテスト
- 通知機能のテスト
- オフライン動作のテスト

### 9.3 E2Eテスト
- ユーザーフローのテスト
- クロスブラウザテスト
- デバイステスト

## 10. デプロイメント仕様

### 10.1 静的ホスティング
- HTTPS必須
- gzip圧縮有効化
- キャッシュヘッダー設定
- Service Worker の適切な配信

### 10.2 CDN設定
- 静的リソースのCDN配信
- 地理的分散によるレスポンス向上
- キャッシュ戦略の最適化