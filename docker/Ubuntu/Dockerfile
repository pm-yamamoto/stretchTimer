#
#   ubuntu 24.04
#   Apache 2.4
#   php8.3 + php-fpm
#   mysql8.4

FROM ubuntu:24.04

# update apt
RUN apt update

# Dockerコンテナ内でviを利用する場合
#RUN apt install -y vim

# Dockerのバックグラウンドプロセス処理で必要なためインストール
RUN apt install -y supervisor

# Dockerでaptインストール中にタイムゾーンを質問されなくなるようにする
RUN apt install -y tzdata
RUN apt update

# PHPインストールの際のリポジトリを追加するためのコマンドをインストール
RUN apt-get update
RUN apt install -y ca-certificates
RUN apt install -y apt-transport-https
RUN apt install -y software-properties-common

# OndřejSurýPHPリポジトリをインポートする
RUN add-apt-repository -y ppa:ondrej/php

# PPAが既存の依存関係に追加のアップグレードをもたらす可能性があるため、パッケージリストを更新する
RUN apt-get update

# PHP8.3をインストールする
RUN apt install -y php8.3 php8.3-common php8.3-cli php8.3-mbstring php8.3-gd php8.3-xml php8.3-opcache php8.3-pdo php8.3-mysqlnd php8.3-curl php8.3-zip
# PHP-FPMをインストールする
RUN apt install -y php8.3-fpm

# http インストール
RUN apt install -y apache2

# postfixをインストール
RUN echo "postfix postfix/main_mailer_type string 'Local only'" | debconf-set-selections && \
    echo "postfix postfix/mailname string localhost" | debconf-set-selections && \
    apt install --assume-yes postfix

# Python3とNode.js開発環境をインストール
RUN apt install -y python3 python3-pip python3-venv python3-dev
RUN apt install -y nodejs npm
RUN apt install -y curl wget git

# Python開発用パッケージ
RUN pip3 install --break-system-packages Pillow requests

# Node.js開発用パッケージ（グローバル）
RUN npm install -g serve http-server

# 開発用ユーティリティ
RUN apt install -y vim nano tree htop openssl

# 開発スクリプトをコピー
ADD ./dev-scripts /home/stretch/dev-scripts
RUN chmod +x /home/stretch/dev-scripts/*.sh
RUN chmod +x /home/stretch/dev-scripts/*.py

# 設定
ADD ./apache2/apache2.conf /etc/apache2/apache2.conf
ADD ./apache2/envvars /etc/apache2/envvars
ADD ./apache2/conf-available/charset.conf /etc/apache2/conf-available/charset.conf
ADD ./apache2/conf-available/security.conf /etc/apache2/conf-available/security.conf
ADD ./apache2/conf-available/localized-error-pages.conf /etc/apache2/conf-available/localized-error-pages.conf
ADD ./apache2/conf-available/other-vhosts-access-log.conf /etc/apache2/conf-available/other-vhosts-access-log.conf
ADD ./apache2/conf-available/serve-cgi-bin.conf /etc/apache2/conf-available/serve-cgi-bin.conf
ADD ./apache2/mods-available/mpm_event.conf /etc/apache2/mods-available/mpm_event.conf
ADD ./apache2/sites-available/_localhost_vhost.conf /etc/apache2/sites-available/_localhost_vhost.conf

ADD ./php/cli/php.ini /etc/php/8.3/cli/php.ini
ADD ./php/fpm/php.ini /etc/php/8.3/fpm/php.ini
ADD ./php/fpm/php-fpm.conf /etc/php/8.3/fpm/php-fpm.conf
ADD ./php/fpm/pool.d/www.conf /etc/php/8.3/fpm/pool.d/www.conf
# プロジェクト専用設定は以下に追加
ADD ./php/cli/conf.d/00-php.ini /etc/php/8.3/cli/conf.d/00-php.ini
ADD ./php/fpm/conf.d/00-php.ini /etc/php/8.3/fpm/conf.d/00-php.ini

ADD ./postfix/main.cf /etc/postfix/main.cf

# Apache2設定
# モジュール設定
RUN a2enmod headers http2 include ssl proxy_http vhost_alias expires rewrite && \
    a2dismod --force autoindex && \
    a2dismod status userdir php8.3 mpm_prefork && \
    a2enmod mpm_event proxy_fcgi setenvif
# バーチャルホスト設定
RUN a2dissite 000-default && \
    a2ensite _localhost_vhost

# supervisor設定
ADD ./supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# http:80,443
EXPOSE 80 443

# 起動
CMD ["/usr/bin/supervisord"]
