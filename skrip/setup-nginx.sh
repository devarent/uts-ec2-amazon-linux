#!/usr/bin/env bash
# =====================================================================
#  setup-nginx.sh
#  Instalasi & konfigurasi web server Nginx pada AWS EC2 (Ubuntu)
#  Jalankan di server  :  bash setup-nginx.sh
# =====================================================================
set -euo pipefail

echo "=============================================="
echo " 1. Update paket Linux"
echo "=============================================="
sudo apt update -y
sudo apt upgrade -y

echo "=============================================="
echo " 2. Instalasi Nginx"
echo "=============================================="
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx --no-pager | head -n 15

echo "=============================================="
echo " 3. Firewall: buka SSH & HTTP"
echo "=============================================="
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw status verbose

echo "=============================================="
echo " 4. Konfigurasi virtual host (opsional)"
echo "=============================================="
if [ -f /etc/nginx/sites-available/website ]; then
  sudo ln -sf /etc/nginx/sites-available/website /etc/nginx/sites-enabled/website
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t && sudo systemctl reload nginx
fi

echo "=============================================="
echo " 5. Verifikasi lokal"
echo "=============================================="
curl -I http://localhost | head -n 5

echo "=============================================="
echo " Selesai. Website tersedia di /var/www/html"
echo " Uji via browser: http://<PUBLIC-IP-EC2>"
echo "=============================================="
