#!/bin/bash

# ストレッチタイマーPWA 開発ツールセット

show_help() {
    echo "=== ストレッチタイマーPWA 開発ツール ==="
    echo ""
    echo "使用方法: dev-tools.sh [コマンド]"
    echo ""
    echo "利用可能なコマンド:"
    echo "  server      - 開発サーバーを起動"
    echo "  https       - HTTPS開発サーバーを起動"
    echo "  ssl         - SSL証明書を作成"
    echo "  test        - アプリケーションのテスト"
    echo "  build       - アイコンなどのビルド"
    echo "  status      - 開発環境の状態確認"
    echo "  logs        - ログ表示"
    echo "  help        - このヘルプを表示"
    echo ""
    echo "例:"
    echo "  ./dev-tools.sh server     # HTTP開発サーバー起動"
    echo "  ./dev-tools.sh https      # HTTPS開発サーバー起動"
    echo "  ./dev-tools.sh ssl        # SSL証明書作成"
}

check_environment() {
    echo "=== 開発環境状態確認 ==="
    echo ""
    
    echo "Python:"
    python3 --version 2>/dev/null || echo "  Python3が利用できません"
    
    echo ""
    echo "Node.js:"
    node --version 2>/dev/null || echo "  Node.jsが利用できません"
    npm --version 2>/dev/null || echo "  npmが利用できません"
    
    echo ""
    echo "作業ディレクトリ:"
    echo "  $(pwd)"
    
    echo ""
    echo "htdocsディレクトリ:"
    if [ -d "/home/stretch/htdocs" ]; then
        echo "  ✓ 存在します"
        echo "  ファイル数: $(find /home/stretch/htdocs -type f | wc -l)"
    else
        echo "  ✗ 見つかりません"
    fi
    
    echo ""
    echo "ポート状況:"
    netstat -tlnp | grep -E "(8000|3000|8080|8443|80|443)" || echo "  開発ポートは使用されていません"
}

start_http_server() {
    echo "=== HTTP開発サーバー起動 ==="
    cd /home/stretch/htdocs
    
    if [ ! -f "index.html" ]; then
        echo "⚠️  index.htmlが見つかりません"
        echo "   現在のディレクトリ: $(pwd)"
        ls -la
        exit 1
    fi
    
    echo "サーバー起動中..."
    echo "アクセスURL: http://localhost:8000"
    echo "終了するには Ctrl+C を押してください"
    echo ""
    
    python3 -m http.server 8000
}

start_https_server() {
    echo "=== HTTPS開発サーバー起動 ==="
    
    # SSL証明書の確認
    if [ ! -f "/home/stretch/ssl/cert.pem" ] || [ ! -f "/home/stretch/ssl/key.pem" ]; then
        echo "SSL証明書が見つかりません。作成しますか？ [y/N]"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            create_ssl_cert
        else
            echo "SSL証明書が必要です。先に 'dev-tools.sh ssl' を実行してください。"
            exit 1
        fi
    fi
    
    # HTTPSサーバー起動スクリプトがなければ作成
    if [ ! -f "/home/stretch/start-https-server.py" ]; then
        python3 /home/stretch/dev-scripts/create-ssl-cert.py
    fi
    
    python3 /home/stretch/start-https-server.py
}

create_ssl_cert() {
    echo "=== SSL証明書作成 ==="
    python3 /home/stretch/dev-scripts/create-ssl-cert.py
}

run_tests() {
    echo "=== アプリケーションテスト ==="
    cd /home/stretch/htdocs
    
    echo "1. ファイル構造チェック"
    required_files=("index.html" "manifest.json" "sw.js" "js/app.js" "css/style.css")
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            echo "  ✓ $file"
        else
            echo "  ✗ $file (見つかりません)"
        fi
    done
    
    echo ""
    echo "2. JavaScriptファイルチェック"
    js_files=("js/timer.js" "js/orientation.js" "js/storage.js" "js/notification.js" "js/pwa.js")
    
    for file in "${js_files[@]}"; do
        if [ -f "$file" ]; then
            echo "  ✓ $file"
        else
            echo "  ✗ $file (見つかりません)"
        fi
    done
    
    echo ""
    echo "3. アイコンファイルチェック"
    icon_files=("icons/icon-192.png" "icons/icon-512.png" "icons/favicon.ico")
    
    for file in "${icon_files[@]}"; do
        if [ -f "$file" ]; then
            echo "  ✓ $file"
        else
            echo "  ✗ $file (見つかりません)"
        fi
    done
    
    echo ""
    echo "4. manifest.json検証"
    if [ -f "manifest.json" ]; then
        python3 -c "import json; json.load(open('manifest.json'))" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "  ✓ manifest.json は有効なJSONです"
        else
            echo "  ✗ manifest.json に構文エラーがあります"
        fi
    fi
    
    echo ""
    echo "テスト完了"
}

build_assets() {
    echo "=== アセットビルド ==="
    cd /home/stretch/htdocs
    
    echo "アイコン生成ツールを起動します..."
    if command -v python3 >/dev/null 2>&1; then
        # Pythonでアイコン生成
        python3 << 'EOF'
try:
    from PIL import Image, ImageDraw
    print("PILが利用可能です。高品質アイコンを生成します。")
    
    # 192x192アイコン生成
    img = Image.new('RGB', (192, 192), color='#4CAF50')
    draw = ImageDraw.Draw(img)
    
    # シンプルなデザイン
    draw.ellipse([50, 50, 142, 142], fill='white', outline='#2E7D32', width=4)
    draw.text((96, 96), '⏱', fill='#2E7D32', anchor='mm')
    
    img.save('icons/icon-192.png', 'PNG')
    
    # 512x512版
    img_large = img.resize((512, 512), Image.LANCZOS)
    img_large.save('icons/icon-512.png', 'PNG')
    
    print("アイコンを生成しました: icons/icon-192.png, icons/icon-512.png")
    
except ImportError:
    print("PILが利用できません。既存のアイコンを使用してください。")
except Exception as e:
    print(f"アイコン生成エラー: {e}")
EOF
    fi
    
    echo ""
    echo "ビルド完了"
}

show_logs() {
    echo "=== ログ表示 ==="
    echo "Apache2 エラーログ:"
    tail -n 20 /var/log/apache2/error.log 2>/dev/null || echo "Apache2ログが見つかりません"
    
    echo ""
    echo "Apache2 アクセスログ:"
    tail -n 10 /var/log/apache2/access.log 2>/dev/null || echo "Apache2アクセスログが見つかりません"
}

# メイン処理
case "${1:-help}" in
    "server")
        start_http_server
        ;;
    "https")
        start_https_server
        ;;
    "ssl")
        create_ssl_cert
        ;;
    "test")
        run_tests
        ;;
    "build")
        build_assets
        ;;
    "status")
        check_environment
        ;;
    "logs")
        show_logs
        ;;
    "help"|*)
        show_help
        ;;
esac