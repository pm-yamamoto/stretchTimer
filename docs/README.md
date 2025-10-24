# ストレッチタイマー

定期的なストレッチを促進するPWA（Progressive Web App）アプリケーション

## 概要

このアプリは設定した間隔でストレッチを促し、スマートフォンの向きセンサーとタップ操作による二段階完了システムでストレッチの実行を確認します。

## 主な機能

- ⏰ カスタマイズ可能なタイマー設定（15分〜240分）
- 📱 デバイスの向きセンサーによる姿勢検知
- ✅ タップ操作による完了確認
- 🔔 プッシュ通知対応
- 📱 PWA対応（インストール可能）
- 🌙 ダークモード対応

## 必要システム

- **ブラウザ**: Chrome 80+, Safari 14+, Firefox 70+, Edge 80+
- **環境**: HTTPS必須（DeviceOrientationAPI使用のため）
- **権限**: 通知許可、デバイス向き検出許可

## インストール・実行方法

### 1. 開発環境での実行

```bash
# プロジェクトをクローン
git clone [repository-url]
cd stretch

# 開発サーバー起動（HTTPSサーバーが必要）
# Python 3を使用する場合
cd htdocs
python -m http.server 8000 --bind 0.0.0.0

# または Node.js/npmを使用する場合
npx serve -s htdocs -p 8000
```

### 2. PWAとしてインストール

1. ブラウザで `https://localhost:8000` にアクセス
2. ブラウザのアドレスバーの「インストール」ボタンをクリック
3. ホーム画面にアプリが追加されます

## 使用方法

1. **初回起動**: 通知とデバイス向き検出の許可が必要
2. **タイマー設定**: 設定画面でストレッチ間隔を調整
3. **ストレッチ実行**: 
   - 通知が表示されたらアプリを開く
   - スマホを持って立つ
   - 画面の指示に従って指定方向を向く
   - 条件が満たされたらタップボタンで完了

## プロジェクト構成

```
stretch/
├── htdocs/                # Webアプリケーションルート
│   ├── index.html         # メインHTML
│   ├── manifest.json      # PWAマニフェスト
│   ├── sw.js             # Service Worker
│   ├── css/              # スタイルシート
│   ├── js/               # JavaScript
│   └── icons/            # アプリアイコン
└── docs/                 # プロジェクト文書
    ├── README.md         # このファイル
    ├── requirements.md   # 要件定義
    ├── specification.md  # 技術仕様
    ├── tasks.md          # タスク管理
    ├── DEVELOPMENT.md    # 開発ガイド
    └── CLAUDE.md         # AI開発支援ガイド
```

## 開発に関して

詳細な開発情報については以下のドキュメントを参照してください：

- [要件定義書](requirements.md)
- [技術仕様書](specification.md)  
- [開発ガイド](DEVELOPMENT.md)
- [タスク管理](tasks.md)

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。開発に参加する際は [DEVELOPMENT.md](DEVELOPMENT.md) をご確認ください。