#!/bin/bash
# Quick Deployment Script untuk cPanel Hosting
# IP: 101.50.1.99
# Domain: aryafatthurahman1.ac.id
# Username: aryafatthur1

set -e

# Konfigurasi
HOST="aryafatthurahman1.ac.id"
USER="aryafatthur1"
REMOTE_DIR="/home/aryafatthur1/public_html"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

# Warna untuk output
green='\033[0;32m'
blue='\033[0;34m'
yellow='\033[1;33m'
red='\033[0;31m'
nc='\033[0m' # No Color

echo -e "${blue}╔══════════════════════════════════════════════════════════════╗${nc}"
echo -e "${blue}║          Quick Deployment - cPanel Hosting                 ║${nc}"
echo -e "${blue}╚══════════════════════════════════════════════════════════════╝${nc}"
echo ""

echo -e "${yellow}Server Information:${nc}"
echo "  Host: $HOST"
echo "  IP: 101.50.1.99"
echo "  User: $USER"
echo "  Remote Dir: $REMOTE_DIR"
echo "  Local Dir: $LOCAL_DIR"
echo ""

# Cek apakah file yang diperlukan ada
missing_files=0
for file in index.html knowledge.html login.html dashboard.html .htaccess; do
    if [ ! -f "$LOCAL_DIR/$file" ]; then
        echo -e "${red}[X] Missing file: $file${nc}"
        missing_files=1
    fi
done

if [ ! -d "$LOCAL_DIR/assets" ]; then
    echo -e "${red}[X] Missing folder: assets${nc}"
    missing_files=1
fi

if [ $missing_files -eq 1 ]; then
    echo ""
    echo -e "${red}[X] Beberapa file tidak ditemukan. Pastikan semua file ada.${nc}"
    echo ""
    exit 1
fi

echo -e "${green}[OK] Semua file yang diperlukan ada${nc}"
echo ""

# Upload files
echo -e "${yellow}Uploading files...${nc}"
for file in index.html knowledge.html login.html dashboard.html README.md DEPLOYMENT-GUIDE.md DEPLOY-CPANEL.md README-DEPLOYMENT.md DEPLOYMENT-CHECKLIST.md .htaccess; do
    if [ -f "$LOCAL_DIR/$file" ]; then
        echo "  Uploading $file..."
        if scp "$LOCAL_DIR/$file" "$USER@$HOST:$REMOTE_DIR/"; then
            echo -e "  ${green}[OK] $file uploaded${nc}"
        else
            echo -e "  ${red}[X] Failed to upload $file${nc}"
        fi
    fi
done

# Upload assets folder
echo ""
echo -e "${yellow}Uploading assets folder...${nc}"
if scp -r "$LOCAL_DIR/assets" "$USER@$HOST:$REMOTE_DIR/"; then
    echo -e "${green}[OK] assets folder uploaded${nc}"
else
    echo -e "${red}[X] Failed to upload assets folder${nc}"
fi

echo ""
echo -e "${blue}╔══════════════════════════════════════════════════════════════╗${nc}"
echo -e "${blue}║          Deployment Complete!                               ║${nc}"
echo -e "${blue}╚══════════════════════════════════════════════════════════════╝${nc}"
echo ""

echo -e "${yellow}Next steps:${nc}"
echo "1. Test website: http://$HOST"
echo "2. Setup SSL certificate di cPanel"
echo "3. Uncomment HTTPS redirect di .htaccess"
echo ""

echo -e "${yellow}Files uploaded:${nc}"
echo "  - index.html"
echo "  - knowledge.html"
echo "  - login.html"
echo "  - dashboard.html"
echo "  - .htaccess"
echo "  - assets/ folder"
echo ""
