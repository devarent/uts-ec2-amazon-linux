#!/usr/bin/env bash
# ------------------------------------------------------------------
# Terbitkan sertifikat Let's Encrypt pertama kali (standalone).
# Prasyarat:
#   - DOMAIN sudah punya A record ke Elastic IP instance ini
#   - port 80 terbuka (Security Group + ufw)
#   - nginx belum memakai port 80 (script ini stop nginx sementara)
# Pemakaian:
#   DOMAIN=app.example.com EMAIL=kamu@example.com sudo -E bash scripts/issue-cert.sh
# ------------------------------------------------------------------
set -euo pipefail

: "${DOMAIN:?Set DOMAIN, contoh: DOMAIN=app.example.com}"
: "${EMAIL:?Set EMAIL untuk notifikasi Let's Encrypt}"

APP_DIR="${APP_DIR:-/opt/app}"
cd "${APP_DIR}"

echo "==> Cek DNS ${DOMAIN}"
RESOLVED="$(getent hosts "${DOMAIN}" | awk '{print $1}' | head -n1 || true)"
PUBLIC_IP="$(curl -fsS https://api.ipify.org || true)"
echo "    DNS    : ${RESOLVED:-tidak resolve}"
echo "    IP VPS : ${PUBLIC_IP:-tidak diketahui}"
if [[ -n "${RESOLVED}" && -n "${PUBLIC_IP}" && "${RESOLVED}" != "${PUBLIC_IP}" ]]; then
  echo "WARN: DNS belum mengarah ke IP ini. Propagasi bisa sampai 5-30 menit."
fi

echo "==> Stop nginx sementara agar port 80 bebas"
docker compose stop nginx 2>/dev/null || true

echo "==> Minta sertifikat (standalone)"
docker run --rm \
  -p 80:80 \
  -v "${APP_DIR}/nginx/certs:/etc/letsencrypt" \
  -v "${APP_DIR}/nginx/www:/var/www/certbot" \
  certbot/certbot certonly \
  --standalone \
  --preferred-challenges http \
  -d "${DOMAIN}" \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --non-interactive

echo "==> Nyalakan nginx"
docker compose up -d nginx

echo "==> Verifikasi"
sleep 3
curl -fsSI "https://${DOMAIN}" | head -n 5 || true

echo
echo "Selesai. Perpanjangan otomatis sudah dipasang oleh setup-ec2.sh (cron 02:30 & 14:30)."
