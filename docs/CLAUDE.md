# Claude Code 開発支援ガイダンス

## 🎯 プロジェクト概要

**ストレッチタイマーPWA**の開発を支援するためのClaude Code向けガイダンスです。

### 基本情報
- **プロジェクト名**: ストレッチタイマー
- **技術スタック**: Vanilla JavaScript + PWA
- **エントリーポイント**: `htdocs/`
- **開発フェーズ**: 要件定義・設計完了、実装開始準備

## 📋 重要なコマンドとスクリプト

### 開発サーバー起動
```bash
# HTTPS開発サーバー（推奨）
cd htdocs && python -m http.server 8000

# または
cd htdocs && npx serve -s . -p 8000 --ssl
```

### テストコマンド
```bash
# 現在はテストフレームワーク未導入
# 手動テストのみ実施
```

### リント・フォーマット
```bash
# 現在は設定なし
# 将来的にESLint + Prettierを検討
```

### ビルドコマンド
```bash
# 静的サイトのため特別なビルド不要
# ファイルをそのままデプロイ
```

## 🏗️ プロジェクト構造理解

### ディレクトリマップ
```
/Users/yamamoto/develop/Private/stretch/
├── docs/                    # 📋 プロジェクト文書
│   ├── README.md           # プロジェクト概要
│   ├── requirements.md     # 要件定義書
│   ├── specification.md    # 技術仕様書
│   ├── tasks.md           # タスク管理
│   ├── DEVELOPMENT.md     # 開発ガイド
│   └── CLAUDE.md          # このファイル
└── htdocs/                 # 🌐 Webアプリケーション（未作成）
    ├── index.html         # メインHTML
    ├── manifest.json      # PWAマニフェスト
    ├── sw.js             # Service Worker
    ├── css/              # スタイルシート
    ├── js/               # JavaScript
    └── icons/            # アプリアイコン
```

### 主要ファイル説明
- **docs/requirements.md**: 機能要件・非機能要件の詳細
- **docs/specification.md**: 技術的な実装仕様
- **docs/tasks.md**: 開発タスクの管理・進捗状況
- **docs/DEVELOPMENT.md**: 開発者向け詳細ガイド

## 🔧 開発作業の指針

### 現在の優先タスク（tasks.mdより）
1. **htdocs/基盤構築** - Phase 2.1
2. **基本UI実装** - Phase 2.3  
3. **タイマー機能実装** - Phase 3.1

### 作業順序の重要性
1. **Phase 2**: 基盤実装（HTML/CSS/JS構造）
2. **Phase 3**: コア機能（タイマー・向き検出・完了システム）
3. **Phase 4**: PWA機能（Service Worker・インストール）
4. **Phase 5**: 通知・UX（通知システム・ダークモード）
5. **Phase 6**: テスト・最適化

## 📝 コーディング規約

### HTML
- セマンティックHTML5使用
- アクセシビリティ重視（ARIA属性）
- PWA対応のメタタグ必須

### CSS
```css
/* CSS Variables使用 */
:root {
  --color-primary: #4CAF50;
  --spacing-md: 16px;
}

/* BEM記法推奨 */
.timer__display {}
.timer__button--disabled {}
```

### JavaScript
```javascript
// ES6+ クラス設計
class TimerManager {
  constructor() {
    this.state = {}
  }
  
  // プライベートメソッドは_prefix
  _tick() {}
}

// ESモジュール使用
export default TimerManager
```

## 🎯 重要な実装ポイント

### 1. DeviceOrientationAPI対応
- **iOS権限要求**: ユーザージェスチャー内で実行必須
- **HTTPS必須**: 開発環境でも必要
- **エラーハンドリング**: 権限拒否時の適切な対応

### 2. PWA要件
- **manifest.json**: アプリ情報・アイコン設定
- **Service Worker**: オフライン対応・キャッシュ戦略
- **HTTPS**: 本番・開発環境両方で必須

### 3. 通知システム
- **権限管理**: 段階的な権限要求
- **ブラウザ差異**: Safari・Chrome・Firefox対応
- **バックグラウンド**: Service Worker経由の通知

### 4. ストレージ
- **LocalStorage**: 設定・履歴の永続化
- **データ構造**: JSON形式での管理
- **エラーハンドリング**: ストレージ無効時の対応

## 🛠️ 開発支援情報

### 頻繁に参照するファイル
- `docs/specification.md` → クラス設計・API仕様
- `docs/tasks.md` → 現在のタスク・優先度
- `docs/DEVELOPMENT.md` → 詳細な実装ガイド

### デバッグ時の確認項目
1. **HTTPS確認**: `https://localhost:8000`でアクセス
2. **Console確認**: DeviceOrientation APIエラー
3. **Application確認**: Service Worker・ローカルストレージ
4. **Lighthouse確認**: PWA要件チェック

### テスト環境
- **Chrome**: DevTools活用・デスクトップ確認
- **Safari**: iOS実機テスト・権限要求確認
- **Firefox**: クロスブラウザ確認

## 📱 デバイス・ブラウザ対応

### 必須対応
- **Chrome 80+** (Android/Desktop)
- **Safari 14+** (iOS/macOS)
- **Firefox 70+** (Android/Desktop)
- **Edge 80+** (Desktop)

### 重要な制限事項
- **iOS Safari**: DeviceOrientationEvent.requestPermission()必須
- **プライベートモード**: LocalStorage制限あり
- **HTTP環境**: DeviceOrientationAPI使用不可

## 🔍 問題解決のヒント

### よくある問題

#### 1. DeviceOrientationが動作しない
```javascript
// 解決方法：権限確認・HTTPS確認・ユーザージェスチャー確認
if (typeof DeviceOrientationEvent.requestPermission === 'function') {
  // iOS 13+での権限要求
  const permission = await DeviceOrientationEvent.requestPermission()
}
```

#### 2. Service Workerが更新されない
```javascript
// 解決方法：キャッシュクリア・強制リロード
// Chrome DevTools > Application > Service Workers > Unregister
```

#### 3. 通知が表示されない
```javascript
// 解決方法：権限確認・HTTPS確認
const permission = await Notification.requestPermission()
console.log('Notification permission:', permission)
```

### デバッグコマンド
```javascript
// LocalStorageクリア
localStorage.clear()

// キャッシュクリア（Console実行）
caches.keys().then(names => names.forEach(name => caches.delete(name)))

// Service Worker再登録
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(reg => reg.unregister())
)
```

## 📚 参考リソース

### API仕様
- [DeviceOrientationEvent - MDN](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent)
- [Notification API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/notification)
- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

### PWAリソース
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Web App Manifests](https://developer.mozilla.org/en-US/docs/Web/Manifest)

## 🚀 次のアクション

### 即座に実行すべきタスク
1. **htdocs/ディレクトリ作成**
   ```bash
   mkdir -p htdocs/{css,js,icons}
   ```

2. **基本ファイル作成**
   ```bash
   touch htdocs/{index.html,manifest.json,sw.js}
   ```

3. **開発サーバー起動確認**
   ```bash
   cd htdocs && python -m http.server 8000
   ```

### コード作成時の注意点
- **必ずHTTPS環境で開発**
- **iOS実機での動作確認**
- **PWA要件の段階的実装**
- **エラーハンドリングの充実**

## 💡 Claude Code使用時のTips

### 効果的な質問例
- "タイマー機能のTimerManagerクラスを実装して"
- "DeviceOrientationAPIのiOS対応を含めて実装"
- "PWAのmanifest.jsonを仕様書通りに作成"
- "Service Workerの基本キャッシュ戦略を実装"

### ファイル参照の活用
- specification.mdの該当セクションを参照
- tasks.mdの現在フェーズを確認
- DEVELOPMENT.mdの実装例を活用

### 段階的実装のリクエスト
- 各Phaseごとの実装依頼
- 機能単位での実装・テスト
- エラーハンドリングを含む堅牢な実装