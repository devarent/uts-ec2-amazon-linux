#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SITE_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
WEB_ROOT="${WEB_ROOT:-/usr/share/nginx/html}"
BACKUP_SUFFIX="$(date +%Y%m%d%H%M%S)-$$"

if [[ ! -f "${SITE_ROOT}/index.html" || ! -d "${SITE_ROOT}/assets" ]]; then
  echo "index.html atau assets/ tidak ditemukan di ${SITE_ROOT}" >&2
  exit 1
fi

echo "=== Membuat backup file situs lama (jika ada) ==="
if sudo test -f "${WEB_ROOT}/index.html"; then
  sudo cp -a "${WEB_ROOT}/index.html" "${WEB_ROOT}/index.html.backup.${BACKUP_SUFFIX}"
fi
if sudo test -d "${WEB_ROOT}/assets"; then
  sudo cp -a "${WEB_ROOT}/assets" "${WEB_ROOT}/assets.backup.${BACKUP_SUFFIX}"
fi

echo "=== Menyalin website ke ${WEB_ROOT} ==="
sudo mkdir -p "$WEB_ROOT"
sudo cp "${SITE_ROOT}/index.html" "${WEB_ROOT}/index.html"
sudo cp -a "${SITE_ROOT}/assets" "${WEB_ROOT}/"
sudo chown -R nginx:nginx "$WEB_ROOT"
sudo find "$WEB_ROOT" -type d -exec chmod 755 {} \;
sudo find "$WEB_ROOT" -type f -exec chmod 644 {} \;

echo "=== Memvalidasi dan memuat ulang Nginx ==="
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
sudo systemctl is-active --quiet nginx

HTTP_STATUS="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' http://127.0.0.1/)"
if [[ "$HTTP_STATUS" != "200" ]]; then
  echo "Website merespons HTTP ${HTTP_STATUS}, bukan 200." >&2
  exit 1
fi
if ! curl --fail --silent http://127.0.0.1/ | grep -q '2023230006'; then
  echo "NIM 2023230006 tidak ditemukan pada halaman yang disajikan." >&2
  exit 1
fi

echo "Deployment berhasil: HTTP ${HTTP_STATUS}; NIM ditemukan."
echo "Buka http://<PUBLIC-IP-EC2> dari komputer atau ponsel."
