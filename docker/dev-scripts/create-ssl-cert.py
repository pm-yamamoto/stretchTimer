#!/usr/bin/env python3
"""
HTTPS開発サーバー用の自己署名証明書作成スクリプト
DeviceOrientation APIのテストにHTTPS環境が必要なため
"""

import os
import subprocess
import sys
from pathlib import Path

def create_ssl_certificate():
    """自己署名SSL証明書を作成"""
    
    cert_dir = Path("/home/stretch/ssl")
    cert_dir.mkdir(exist_ok=True)
    
    cert_file = cert_dir / "cert.pem"
    key_file = cert_dir / "key.pem"
    
    print("=== HTTPS開発用SSL証明書作成 ===")
    print(f"証明書ディレクトリ: {cert_dir}")
    
    # OpenSSLで自己署名証明書を作成
    cmd = [
        "openssl", "req", "-x509", "-newkey", "rsa:4096",
        "-keyout", str(key_file),
        "-out", str(cert_file),
        "-days", "365",
        "-nodes",
        "-subj", "/C=JP/ST=Tokyo/L=Tokyo/O=Development/OU=StretchTimer/CN=localhost"
    ]
    
    try:
        print("OpenSSL証明書作成中...")
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print("証明書作成完了！")
        
        print(f"\n証明書ファイル: {cert_file}")
        print(f"秘密鍵ファイル: {key_file}")
        
        # HTTPS開発サーバー起動スクリプト作成
        create_https_server_script(cert_file, key_file)
        
    except subprocess.CalledProcessError as e:
        print(f"エラー: {e}")
        print("OpenSSLがインストールされていない可能性があります")
        return False
    except FileNotFoundError:
        print("OpenSSLコマンドが見つかりません")
        print("apt install openssl を実行してください")
        return False
    
    return True

def create_https_server_script(cert_file, key_file):
    """HTTPS開発サーバー起動スクリプト作成"""
    
    script_content = f'''#!/usr/bin/env python3
"""
HTTPS開発サーバー
ストレッチタイマーPWAのDeviceOrientation APIテスト用
"""

import http.server
import ssl
import socketserver
import os

PORT = 8443
DIRECTORY = "/home/stretch/htdocs"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_https_server():
    os.chdir(DIRECTORY)
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        # SSL設定
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain('{cert_file}', '{key_file}')
        
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
        
        print(f"HTTPS開発サーバー起動:")
        print(f"https://localhost:{{PORT}}")
        print(f"ドキュメントルート: {{DIRECTORY}}")
        print("終了するには Ctrl+C を押してください")
        print("")
        print("⚠️  自己署名証明書のため、ブラウザで警告が表示されます")
        print("   「詳細設定」→「localhost にアクセスする（安全ではありません）」をクリック")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\\nサーバーを停止しました")

if __name__ == "__main__":
    start_https_server()
'''
    
    script_file = Path("/home/stretch/start-https-server.py")
    with open(script_file, 'w') as f:
        f.write(script_content)
    
    # 実行権限付与
    os.chmod(script_file, 0o755)
    
    print(f"\nHTTPS サーバースクリプト作成: {script_file}")
    print("使用方法: python3 /home/stretch/start-https-server.py")

def main():
    print("DeviceOrientation API テスト用のHTTPS環境をセットアップします")
    print("※ iOSでの動作確認にHTTPS環境が必要です")
    print()
    
    if not create_ssl_certificate():
        sys.exit(1)
    
    print("\n=== セットアップ完了 ===")
    print("次の手順でHTTPS開発サーバーを起動できます:")
    print("1. docker-compose exec stretch_ubuntu24 bash")
    print("2. python3 /home/stretch/start-https-server.py")
    print("3. ブラウザで https://localhost:8443 にアクセス")

if __name__ == "__main__":
    main()