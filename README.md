# ストレッチタイマー PWA

定期的なストレッチを促進するプログレッシブウェブアプリ（PWA）です。  
デバイスの向きを検知して、立位と方向一致を確認してストレッチ完了を記録します。

## 🎯 特徴

- **タイマー機能**: 設定可能なストレッチ間隔（15分〜240分）
- **向き検知**: DeviceOrientation APIによる立位・方向検知
- **PWA対応**: オフライン動作、ホーム画面追加、プッシュ通知
- **ダークモード**: 目に優しいテーマ切り替え
- **統計機能**: 完了履歴と連続記録の管理
- **レスポンシブ**: モバイルファースト設計

## 🚀 技術スタック

- **フロントエンド**: Vanilla JavaScript (ES6+)
- **CSS**: CSS Variables, Flexbox, Grid
- **PWA**: Service Worker, Web App Manifest
- **API**: DeviceOrientation API, Notification API, LocalStorage
- **開発環境**: Docker (Ubuntu 24.04 + Apache2.4 + PHP8.3)

## 📱 対応デバイス・ブラウザ

### 必須対応
- Chrome 80+ (Android/Desktop)
- Safari 14+ (iOS/macOS) 
- Firefox 70+ (Android/Desktop)
- Edge 80+ (Desktop)

### 重要な制限
- **iOS Safari**: DeviceOrientation権限要求必須
- **HTTPS環境**: DeviceOrientation API使用に必要
- **プライベートモード**: LocalStorage制限あり

## 🔧 開発環境セットアップ

### 前提条件
- Docker Desktop
- Git

### 1. リポジトリクローン
```bash
git clone https://github.com/pm-yamamoto/stretchTimer.git
cd stretchTimer
```

### 2. Docker環境構築
```bash
# 自動セットアップスクリプト実行
./test-docker-setup.sh

# または手動で：
cd docker
docker-compose build
docker-compose up -d
```

### 3. 開発サーバー起動
```bash
# コンテナに接続
docker-compose exec stretch_ubuntu24 bash

# HTTP開発サーバー起動
/home/stretch/dev-scripts/dev-tools.sh server
# -> http://localhost:8000

# HTTPS開発サーバー起動（iOS対応）
/home/stretch/dev-scripts/dev-tools.sh https
# -> https://localhost:8443 (SSL証明書作成後)
```

## 🌐 アクセスURL

| 用途 | URL | 説明 |
|------|-----|------|
| Apache | http://localhost:80 | 本番環境相当 |
| Python開発サーバー | http://localhost:8000 | 開発推奨 |
| HTTPS開発サーバー | https://localhost:8443 | iOS テスト用 |
| Node.js開発サーバー | http://localhost:3000 | 代替サーバー |
| MySQL | localhost:13306 | データベース |
| MailHog | http://localhost:8025 | メール確認 |

## 🛠️ 開発ツール

### 統合開発ツール
```bash
# コンテナ内で実行
/home/stretch/dev-scripts/dev-tools.sh [コマンド]

# 利用可能コマンド
server      # HTTP開発サーバー起動
https       # HTTPS開発サーバー起動  
ssl         # SSL証明書作成
test        # アプリテスト
build       # アセットビルド
status      # 開発環境状態確認
help        # ヘルプ表示
```

### SSL証明書作成（iOS対応）
```bash
# HTTPS環境セットアップ
/home/stretch/dev-scripts/dev-tools.sh ssl

# HTTPSサーバー起動
/home/stretch/dev-scripts/dev-tools.sh https
```

## 📂 プロジェクト構成

```
stretchTimer/
├── htdocs/                 # 🌐 Webアプリケーション
│   ├── index.html         # メインHTML
│   ├── manifest.json      # PWAマニフェスト
│   ├── sw.js             # Service Worker
│   ├── css/              # スタイルシート
│   │   ├── style.css     # メインCSS
│   │   ├── dark-theme.css # ダークモード
│   │   └── responsive.css # レスポンシブ
│   ├── js/               # JavaScript
│   │   ├── app.js        # メインアプリ
│   │   ├── timer.js      # タイマー管理
│   │   ├── orientation.js # 向き検知
│   │   ├── storage.js    # ストレージ管理
│   │   ├── notification.js # 通知管理
│   │   └── pwa.js        # PWA機能
│   └── icons/            # アプリアイコン
├── docker/               # 🐳 Docker設定
│   ├── docker-compose.yml
│   ├── Ubuntu/Dockerfile
│   ├── dev-scripts/      # 開発スクリプト
│   ├── mysql/           # MySQL設定
│   └── apache2/         # Apache設定
├── docs/                # 📋 プロジェクト文書
│   ├── README.md        # プロジェクト概要
│   ├── requirements.md  # 要件定義
│   ├── specification.md # 技術仕様
│   ├── tasks.md        # タスク管理
│   ├── DEVELOPMENT.md  # 開発ガイド
│   └── CLAUDE.md       # Claude支援情報
└── test-docker-setup.sh # Docker環境テスト
```

## 🔍 主要機能の実装

### タイマー機能
```javascript
// タイマー開始
const timer = new TimerManager();
timer.start(1800); // 30分 = 1800秒
timer.on('complete', () => {
    console.log('ストレッチ時間です！');
});
```

### デバイス向き検知
```javascript
// 向き検知開始
const orientation = new OrientationManager();
await orientation.requestPermission(); // iOS権限要求
orientation.startMonitoring();
orientation.on('statusChange', (status) => {
    console.log(`立位: ${status.isUpright}, 方向: ${status.direction}`);
});
```

### 通知機能
```javascript
// 通知送信
const notification = new NotificationManager();
await notification.requestPermission();
await notification.showStretchNotification();
```

## 🧪 テスト

### 機能テスト
```bash
# コンテナ内でテスト実行
/home/stretch/dev-scripts/dev-tools.sh test
```

### ブラウザテスト
1. **Chrome/Edge**: DevToolsでモバイル表示確認
2. **Safari**: iOS実機でのDeviceOrientation権限確認
3. **Firefox**: PWA機能とService Worker確認

### PWA検証
- Chrome DevTools > Lighthouse > PWA監査実行
- Application タブで Service Worker とマニフェスト確認

## 📱 iOS実機テスト手順

1. **HTTPS環境準備**
   ```bash
   /home/stretch/dev-scripts/dev-tools.sh ssl
   /home/stretch/dev-scripts/dev-tools.sh https
   ```

2. **iOSデバイスでアクセス**
   - `https://[開発PC IP]:8443` にアクセス
   - 証明書警告を「続ける」で回避

3. **権限要求確認**
   - DeviceOrientation権限ダイアログ表示確認
   - 通知権限要求確認

4. **PWA機能確認**
   - 「ホーム画面に追加」表示確認
   - スタンドアロン起動確認

## 🚀 デプロイ

### 開発環境デプロイ
```bash
# Apache経由で確認
docker-compose up -d
# -> http://localhost:80
```

### 本番環境要件
- HTTPS必須（Let's Encrypt推奨）
- Service Workerキャッシュ戦略確認
- セキュリティヘッダー設定
- ドメイン検証済み証明書

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

1. フォーク作成
2. フィーチャーブランチ作成 (`git checkout -b feature/amazing-feature`)
3. 変更コミット (`git commit -m 'Add amazing feature'`)
4. ブランチプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエスト作成

## 📞 サポート

- **Issues**: [GitHub Issues](https://github.com/pm-yamamoto/stretchTimer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/pm-yamamoto/stretchTimer/discussions)

## 📚 関連ドキュメント

- [要件定義書](docs/requirements.md)
- [技術仕様書](docs/specification.md)
- [開発ガイド](docs/DEVELOPMENT.md)
- [タスク管理](docs/tasks.md)

---

**健康的なワークライフのために、定期的なストレッチを習慣化しましょう！** 💪