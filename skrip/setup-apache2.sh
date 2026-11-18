#!/usr/bin/env bash
# =====================================================================
#  setup-apache2.sh
#  Instalasi & konfigurasi web server Apache2 pada AWS EC2 (Ubuntu)
#  Jalankan di server  :  bash setup-apache2.sh
# =====================================================================
set -euo pipefail

echo "=============================================="
echo " 1. Update paket Linux"
echo "=============================================="
sudo apt update -y
sudo apt upgrade -y

echo "=============================================="
echo " 2. Instalasi Apache2"
echo "=============================================="
sudo apt install -y apache2
sudo systemctl enable apache2      # aktif saat server dinyalakan
sudo systemctl start apache2
sudo systemctl status apache2 --no-pager | head -n 15

echo "=============================================="
echo " 3. Buka port 80 & 22 pada firewall server"
echo "=============================================="
sudo ufw allow OpenSSH        # pastikan SSH tidak terputus
sudo ufw allow 80/tcp         # HTTP untuk website
sudo ufw status verbose

echo "=============================================="
echo " 4. Verifikasi lokal"
echo "=============================================="
curl -I http://localhost | head -n 5

echo "=============================================="
echo " Selesai. webpages tersedia di /var/www/html"
echo " Uji via browser: http://<PUBLIC-IP-EC2>"
echo "=============================================="
