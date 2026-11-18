#!/usr/bin/env bash
set -euo pipefail

if [[ ! -r /etc/os-release ]]; then
  echo "Tidak dapat mendeteksi sistem operasi." >&2
  exit 1
fi

# shellcheck disable=SC1091
source /etc/os-release
if [[ "${ID:-}" != "amzn" || "${VERSION_ID%%.*}" != "2023" ]]; then
  echo "Skrip ini hanya mendukung Amazon Linux 2023." >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/nginx-amazon-linux.conf"
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "File konfigurasi tidak ditemukan: $CONFIG_FILE" >&2
  exit 1
fi

echo "=== Memasang Nginx pada Amazon Linux 2023 ==="
sudo dnf install -y nginx
if sudo test -f /etc/nginx/nginx.conf; then
  sudo cp -a /etc/nginx/nginx.conf "/etc/nginx/nginx.conf.backup.$(date +%Y%m%d%H%M%S)-$$"
fi
sudo install -D -m 0644 "$CONFIG_FILE" /etc/nginx/nginx.conf
sudo mkdir -p /usr/share/nginx/html
sudo chown -R nginx:nginx /usr/share/nginx/html
sudo find /usr/share/nginx/html -type d -exec chmod 755 {} \;
sudo find /usr/share/nginx/html -type f -exec chmod 644 {} \;

echo "=== Memvalidasi konfigurasi Nginx ==="
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
sudo systemctl is-active --quiet nginx
echo "Nginx aktif."

echo
echo "Selesai. Web root: /usr/share/nginx/html"
echo "Pastikan Security Group mengizinkan HTTP (TCP 80), lalu buka http://<PUBLIC-IP-EC2>"
