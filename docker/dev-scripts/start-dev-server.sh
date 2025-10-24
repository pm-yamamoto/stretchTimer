#!/bin/bash

# ストレッチタイマーPWA開発サーバー起動スクリプト

echo "=== ストレッチタイマー開発サーバー起動 ==="

# 作業ディレクトリに移動
cd /home/stretch/htdocs

echo "作業ディレクトリ: $(pwd)"
echo "ファイル一覧:"
ls -la

# Pythonバージョン確認
echo ""
echo "Python バージョン:"
python3 --version

# Node.jsバージョン確認
echo ""
echo "Node.js バージョン:"
node --version
npm --version

echo ""
echo "=== 開発サーバーを起動します ==="
echo "アクセス URL:"
echo "- http://localhost:8000 (Python HTTP Server)"
echo "- http://localhost:3000 (Node.js Serve)"
echo "- http://localhost:80 (Apache)"
echo ""

# 複数のサーバーを選択可能にする
echo "どのサーバーを起動しますか？"
echo "1) Python HTTP Server (推奨)"
echo "2) Node.js Serve"
echo "3) HTTP Server (Node.js)"
echo "4) すべて起動 (バックグラウンド)"
echo ""

# デフォルトでPython HTTP Serverを起動
read -p "選択してください [1]: " choice
choice=${choice:-1}

case $choice in
    1)
        echo "Python HTTP Server を起動中..."
        python3 -m http.server 8000
        ;;
    2)
        echo "Node.js Serve を起動中..."
        npx serve -s . -p 3000
        ;;
    3)
        echo "HTTP Server (Node.js) を起動中..."
        npx http-server -p 8080 -c-1
        ;;
    4)
        echo "すべてのサーバーをバックグラウンドで起動中..."
        python3 -m http.server 8000 &
        npx serve -s . -p 3000 &
        npx http-server -p 8080 -c-1 &
        echo "サーバー起動完了"
        echo "終了するには Ctrl+C を押してください"
        wait
        ;;
    *)
        echo "無効な選択です。Python HTTP Server を起動します..."
        python3 -m http.server 8000
        ;;
esac