# 開発ガイド

## 🚀 開発環境セットアップ

### 前提条件
- **Node.js**: 18.0+ (開発サーバー用)
- **ブラウザ**: Chrome 80+, Safari 14+, Firefox 70+
- **HTTPS**: 開発環境でもHTTPS必須（DeviceOrientationAPI要求）

### 推奨開発ツール
- **エディタ**: VS Code
- **拡張機能**:
  - Live Server
  - Prettier
  - ESLint
  - PWA Tools

### 開発サーバー起動

#### 方法1: Python（推奨）
```bash
cd htdocs
# Python 3
python -m http.server 8000

# HTTPS化（自己署名証明書使用）
# openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
# python -m http.server 8000 --bind 0.0.0.0 --ssl
```

#### 方法2: Node.js
```bash
# live-serverを使用
npx live-server htdocs --port=8000 --https

# または serve を使用
npx serve -s htdocs -p 8000 --ssl
```

#### 方法3: VS Code Live Server
1. VS Code Live Server拡張機能インストール
2. htdocs/index.html右クリック
3. "Open with Live Server"選択

### HTTPS証明書作成（開発用）
```bash
# 自己署名証明書作成
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# 簡易版（テスト用）
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/C=JP/ST=Tokyo/L=Tokyo/O=Dev/OU=Dev/CN=localhost"
```

## 📁 プロジェクト構成

```
stretch/
├── htdocs/                    # Webアプリルート
│   ├── index.html            # メインHTML
│   ├── manifest.json         # PWAマニフェスト
│   ├── sw.js                # Service Worker
│   ├── css/
│   │   ├── style.css        # メインスタイル
│   │   ├── responsive.css   # レスポンシブ対応
│   │   └── dark-theme.css   # ダークモード
│   ├── js/
│   │   ├── app.js           # メインアプリ
│   │   ├── timer.js         # タイマー機能
│   │   ├── orientation.js   # 向き検出
│   │   ├── notification.js  # 通知機能
│   │   ├── storage.js       # ストレージ管理
│   │   └── pwa.js           # PWA機能
│   └── icons/
│       ├── icon-192.png     # PWAアイコン
│       ├── icon-512.png     # PWAアイコン
│       └── favicon.ico      # ファビコン
├── docs/                     # プロジェクト文書
└── tests/                    # テストファイル（後で作成）
```

## 🛠️ 開発フロー

### 1. 基本開発サイクル

#### ブランチ戦略
```bash
# 機能開発
git checkout -b feature/timer-implementation
git commit -m "feat: implement timer basic functionality"

# バグ修正
git checkout -b bugfix/orientation-detection-ios
git commit -m "fix: resolve orientation permission on iOS Safari"

# リリース準備
git checkout -b release/v1.0.0
git commit -m "chore: prepare release v1.0.0"
```

#### コミットメッセージ規約
```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント変更
style: フォーマット変更（機能に影響なし）
refactor: リファクタリング
test: テスト追加・変更
chore: ビルド・設定変更
```

### 2. 開発手順

#### Phase 1: 基盤構築
1. **ディレクトリ作成**
   ```bash
   mkdir -p htdocs/{css,js,icons}
   ```

2. **基本ファイル作成**
   ```bash
   touch htdocs/{index.html,manifest.json,sw.js}
   touch htdocs/css/{style.css,responsive.css,dark-theme.css}
   touch htdocs/js/{app.js,timer.js,orientation.js,notification.js,storage.js,pwa.js}
   ```

3. **アイコン準備**
   - 192x192pxアイコン作成
   - 512x512pxアイコン作成
   - favicon.ico作成

#### Phase 2: コア機能実装
1. **HTML構造作成**
2. **CSS基盤構築**  
3. **JavaScript基盤実装**
4. **PWA基本設定**

## 🎨 CSS開発ガイドライン

### CSS設計方針
- **Mobile First**: モバイル優先設計
- **CSS Variables**: テーマ対応
- **BEM記法**: クラス命名規則

### CSS Variables定義
```css
:root {
  /* カラーパレット */
  --color-primary: #4CAF50;
  --color-secondary: #FFC107;
  --color-success: #4CAF50;
  --color-error: #F44336;
  --color-warning: #FF9800;
  --color-info: #2196F3;
  
  /* テキストカラー */
  --text-primary: #212121;
  --text-secondary: #757575;
  --text-disabled: #BDBDBD;
  
  /* 背景カラー */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --bg-surface: #FFFFFF;
  
  /* スペーシング */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* ブレークポイント */
  --bp-mobile: 375px;
  --bp-tablet: 768px;
  --bp-desktop: 1024px;
}

/* ダークモード */
[data-theme="dark"] {
  --text-primary: #FFFFFF;
  --text-secondary: #B0B0B0;
  --bg-primary: #121212;
  --bg-secondary: #1E1E1E;
  --bg-surface: #2D2D2D;
}
```

### レスポンシブデザイン
```css
/* Mobile First Base */
.container {
  width: 100%;
  padding: var(--spacing-md);
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

## 💻 JavaScript開発ガイドライン

### ES6+ 機能使用
- **Classes**: オブジェクト指向設計
- **Modules**: ESモジュール使用
- **Async/Await**: 非同期処理
- **Template Literals**: 文字列操作
- **Destructuring**: 分割代入

### 設計パターン

#### クラス設計例
```javascript
// timer.js
class TimerManager {
  constructor() {
    this.state = {
      isRunning: false,
      startTime: null,
      duration: 0,
      remaining: 0
    }
    
    this.callbacks = {
      onTick: null,
      onComplete: null
    }
  }
  
  start(duration, callbacks = {}) {
    this.state.duration = duration
    this.state.startTime = Date.now()
    this.state.isRunning = true
    this.callbacks = { ...this.callbacks, ...callbacks }
    
    this._tick()
  }
  
  _tick() {
    if (!this.state.isRunning) return
    
    const elapsed = Date.now() - this.state.startTime
    this.state.remaining = Math.max(0, this.state.duration - elapsed)
    
    if (this.callbacks.onTick) {
      this.callbacks.onTick(this.state.remaining)
    }
    
    if (this.state.remaining <= 0) {
      this._complete()
      return
    }
    
    requestAnimationFrame(() => this._tick())
  }
  
  _complete() {
    this.state.isRunning = false
    if (this.callbacks.onComplete) {
      this.callbacks.onComplete()
    }
  }
}

export default TimerManager
```

#### モジュール構成
```javascript
// app.js - メインアプリケーション
import TimerManager from './timer.js'
import OrientationManager from './orientation.js'
import NotificationManager from './notification.js'
import StorageManager from './storage.js'

class StretchTimer {
  constructor() {
    this.timer = new TimerManager()
    this.orientation = new OrientationManager()
    this.notification = new NotificationManager()
    this.storage = new StorageManager()
    
    this.init()
  }
  
  async init() {
    await this.loadSettings()
    this.setupEventListeners()
    this.render()
  }
}

// アプリ起動
document.addEventListener('DOMContentLoaded', () => {
  new StretchTimer()
})
```

### エラーハンドリング
```javascript
class OrientationManager {
  async requestPermission() {
    try {
      // iOS 13+ の権限要求
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission()
        if (permission !== 'granted') {
          throw new Error('Orientation permission denied')
        }
      }
      
      return true
    } catch (error) {
      console.error('Failed to request orientation permission:', error)
      this.showError('デバイスの向き検出権限が必要です')
      return false
    }
  }
  
  showError(message) {
    // エラー表示ロジック
    const errorDiv = document.createElement('div')
    errorDiv.className = 'error-message'
    errorDiv.textContent = message
    document.body.appendChild(errorDiv)
    
    setTimeout(() => errorDiv.remove(), 5000)
  }
}
```

## 🔧 PWA開発ガイドライン

### Manifest設定
```json
{
  "name": "ストレッチタイマー",
  "short_name": "ストレッチ",
  "description": "定期的なストレッチを促進するタイマーアプリ",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#ffffff",
  "theme_color": "#4CAF50",
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

### Service Worker実装
```javascript
// sw.js
const CACHE_NAME = 'stretch-timer-v1'
const STATIC_CACHE_FILES = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/timer.js',
  '/js/orientation.js',
  '/js/notification.js',
  '/js/storage.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
]

// インストール時
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_CACHE_FILES))
      .then(() => self.skipWaiting())
  )
})

// アクティベート時
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// フェッチ時
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request)
      })
      .catch(() => {
        // オフライン時のフォールバック
        if (event.request.destination === 'document') {
          return caches.match('/')
        }
      })
  )
})
```

## 🧪 テストガイドライン

### 手動テスト項目

#### 基本機能テスト
- [ ] タイマー設定（15-240分）
- [ ] タイマー開始/停止/一時停止
- [ ] 設定の保存/復元
- [ ] デバイス向き検出
- [ ] ストレッチ完了フロー

#### PWAテスト  
- [ ] インストールプロンプト表示
- [ ] アプリとしてインストール可能
- [ ] オフライン時の基本動作
- [ ] Service Worker更新

#### 通知テスト
- [ ] 通知権限要求
- [ ] 通知表示
- [ ] 通知タップでアプリ起動

#### クロスブラウザテスト
- [ ] Chrome (Android/Desktop)
- [ ] Safari (iOS/macOS)
- [ ] Firefox (Android/Desktop)
- [ ] Edge (Desktop)

### 自動テスト（将来実装）
```javascript
// tests/timer.test.js
import TimerManager from '../htdocs/js/timer.js'

describe('TimerManager', () => {
  let timer
  
  beforeEach(() => {
    timer = new TimerManager()
  })
  
  test('should start timer correctly', () => {
    const duration = 60000 // 1分
    timer.start(duration)
    
    expect(timer.state.isRunning).toBe(true)
    expect(timer.state.duration).toBe(duration)
  })
  
  test('should calculate remaining time correctly', () => {
    // テスト実装
  })
})
```

## 🚀 デプロイメントガイド

### 静的ホスティング設定

#### GitHub Pages
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./htdocs
```

#### Netlify
```toml
# netlify.toml
[build]
  publish = "htdocs"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### パフォーマンス最適化
- **画像最適化**: WebP形式推奨
- **CSS最小化**: 本番環境で実施
- **JavaScript最小化**: 本番環境で実施  
- **gzip圧縮**: サーバー側設定

## 🐛 デバッグ・トラブルシューティング

### よくある問題

#### DeviceOrientationAPI関連
```javascript
// iOS Safari での権限要求
if (typeof DeviceOrientationEvent.requestPermission === 'function') {
  // ユーザージェスチャー内で実行する必要がある
  button.addEventListener('click', async () => {
    const permission = await DeviceOrientationEvent.requestPermission()
    console.log('Permission:', permission)
  })
}
```

#### Service Worker更新
```javascript
// Service Worker強制更新
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister()
    }
  })
}
```

#### キャッシュ削除
```javascript
// 開発時のキャッシュクリア
caches.keys().then(names => {
  names.forEach(name => {
    caches.delete(name)
  })
})
```

### デバッグツール
- **Chrome DevTools**: PWA, Service Worker デバッグ
- **Lighthouse**: パフォーマンス監査
- **Web Inspector**: Safari デバッグ
- **Firefox Developer Tools**: Firefox デバッグ

## 📚 参考リソース

### API仕様書
- [DeviceOrientationEvent - MDN](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent)
- [Notification API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/notification)
- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

### PWA関連
- [PWA Checklist - web.dev](https://web.dev/pwa-checklist/)
- [Workbox - Google](https://developers.google.com/web/tools/workbox)

### ベストプラクティス
- [Web Fundamentals - Google](https://developers.google.com/web/fundamentals)
- [JavaScript Best Practices - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)