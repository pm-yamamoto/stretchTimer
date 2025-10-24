#!/bin/bash

# Docker環境セットアップテストスクリプト

echo "=== ストレッチタイマーPWA Docker環境テスト ==="
echo ""

# 現在のディレクトリ確認
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "スクリプト実行ディレクトリ: $SCRIPT_DIR"

cd "$SCRIPT_DIR/docker" || exit 1
echo "Docker設定ディレクトリ: $(pwd)"

# Docker Composeファイルの確認
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml が見つかりません"
    exit 1
fi

echo "✅ docker-compose.yml 確認済み"

# Dockerfileの確認
if [ ! -f "Ubuntu/Dockerfile" ]; then
    echo "❌ Ubuntu/Dockerfile が見つかりません"  
    exit 1
fi

echo "✅ Ubuntu/Dockerfile 確認済み"

# 開発スクリプトの確認
if [ ! -d "dev-scripts" ]; then
    echo "❌ dev-scripts ディレクトリが見つかりません"
    exit 1
fi

echo "✅ 開発スクリプト確認済み"

# 既存コンテナの停止と削除
echo ""
echo "=== 既存コンテナの停止・削除 ==="
docker-compose down --remove-orphans

# Dockerイメージの削除（任意）
echo ""
echo "イメージを再構築しますか？ [y/N]"
read -r rebuild_image

if [[ "$rebuild_image" =~ ^[Yy]$ ]]; then
    echo "既存イメージを削除中..."
    docker-compose down --rmi local --remove-orphans
fi

# コンテナの構築と起動
echo ""
echo "=== コンテナ構築・起動 ==="
echo "※ 初回は時間がかかります（10-15分程度）"
echo ""

docker-compose build --no-cache stretch_ubuntu24

if [ $? -ne 0 ]; then
    echo "❌ コンテナ構築に失敗しました"
    exit 1
fi

echo "✅ コンテナ構築完了"

# コンテナ起動
echo ""
echo "コンテナを起動中..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ コンテナ起動に失敗しました"
    exit 1
fi

echo "✅ コンテナ起動完了"

# コンテナ状態確認
echo ""
echo "=== コンテナ状態確認 ==="
docker-compose ps

# 開発環境テスト
echo ""
echo "=== 開発環境テスト ==="
echo "コンテナ内でPython環境をテスト中..."

# Python環境テスト
docker-compose exec -T stretch_ubuntu24 python3 --version
if [ $? -eq 0 ]; then
    echo "✅ Python3 利用可能"
else
    echo "❌ Python3 利用不可"
fi

# Node.js環境テスト
docker-compose exec -T stretch_ubuntu24 node --version
if [ $? -eq 0 ]; then
    echo "✅ Node.js 利用可能"
else
    echo "❌ Node.js 利用不可"
fi

# 開発スクリプトテスト
docker-compose exec -T stretch_ubuntu24 ls -la /home/stretch/dev-scripts/
if [ $? -eq 0 ]; then
    echo "✅ 開発スクリプト配置済み"
else
    echo "❌ 開発スクリプト配置失敗"
fi

# htdocsマウント確認
echo ""
echo "htdocsマウント確認:"
docker-compose exec -T stretch_ubuntu24 ls -la /home/stretch/htdocs/ | head -10

# ポート確認
echo ""
echo "=== ポート確認 ==="
echo "以下のポートでアクセス可能です:"
echo "- http://localhost:80 (Apache)"
echo "- http://localhost:8000 (Python開発サーバー)"
echo "- http://localhost:3000 (Node.js開発サーバー)"
echo "- http://localhost:8080 (代替開発サーバー)"
echo "- http://localhost:13306 (MySQL)"
echo "- http://localhost:8025 (MailHog)"

# 開発コマンド例
echo ""
echo "=== 開発コマンド例 ==="
echo "コンテナに接続:"
echo "  docker-compose exec stretch_ubuntu24 bash"
echo ""
echo "Python開発サーバー起動:"
echo "  docker-compose exec stretch_ubuntu24 /home/stretch/dev-scripts/dev-tools.sh server"
echo ""
echo "HTTPS開発サーバー起動:"
echo "  docker-compose exec stretch_ubuntu24 /home/stretch/dev-scripts/dev-tools.sh https"
echo ""
echo "開発環境状態確認:"
echo "  docker-compose exec stretch_ubuntu24 /home/stretch/dev-scripts/dev-tools.sh status"

echo ""
echo "=== セットアップ完了 ==="
echo "✅ Docker環境の準備が完了しました"
echo ""
echo "次の手順:"
echo "1. docker-compose exec stretch_ubuntu24 bash でコンテナに入る"
echo "2. /home/stretch/dev-scripts/dev-tools.sh server でサーバー起動"
echo "3. http://localhost:8000 でアプリケーションにアクセス"