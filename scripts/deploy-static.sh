#!/usr/bin/env bash
# ------------------------------------------------------------------
# Script deployment static site ke EC2
#   Penggunaan:
#     export EC2_HOST="203.0.113.10"
#     export EC2_USER="ubuntu"  # atau ec2-user untuk Amazon Linux
#     export EC2_KEY="~/.ssh/uts-ec2.pem"
#     bash scripts/deploy-static.sh
# ------------------------------------------------------------------
set -euo pipefail

# Konfigurasi
EC2_HOST="${EC2_HOST:-}"
EC2_USER="${EC2_USER:-ubuntu}"
EC2_KEY="${EC2_KEY:-~/.ssh/uts-ec2.pem}"
REMOTE_DOCROOT="/var/www/uts"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Validasi
if [[ -z "${EC2_HOST}" ]]; then
  echo "Error: EC2_HOST belum diset."
  echo "  Contoh: export EC2_HOST=203.0.113.10"
  exit 1
fi

if [[ ! -f "${EC2_KEY}" ]]; then
  echo "Error: Key file tidak ditemukan: ${EC2_KEY}"
  exit 1
fi

echo "=== Deployment Static Site ke EC2 ==="
echo "Host: ${EC2_USER}@${EC2_HOST}"
echo "Key:  ${EC2_KEY}"
echo "Local: ${LOCAL_DIR}"
echo "Remote: ${REMOTE_DOCROOT}"
echo

# 1. Test koneksi SSH
echo "[1/5] Test koneksi SSH..."
ssh -i "${EC2_KEY}" -o StrictHostKeyChecking=no \
  -o ConnectTimeout=10 \
  "${EC2_USER}@${EC2_HOST}" \
  "echo 'SSH connection OK'"

# 2. Buat direktori remote
echo "[2/5] Buat direktori docroot..."
ssh -i "${EC2_KEY}" "${EC2_USER}@${EC2_HOST}" \
  "sudo mkdir -p ${REMOTE_DOCROOT} && sudo chown -R ${EC2_USER}:${EC2_USER} ${REMOTE_DOCROOT}"

# 3. Upload file statis
echo "[3/5] Upload file statis..."
rsync -avz --delete \
  -e "ssh -i ${EC2_KEY} -o StrictHostKeyChecking=no" \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'app' \
  --exclude 'db' \
  --exclude 'docker-compose*.yml' \
  --exclude 'backups' \
  --exclude 'LAB' \
  --exclude 'UTS-EC2-WebHosting' \
  --exclude '*.zip' \
  --exclude 'koleksi-uts-static-site.zip' \
  --exclude 'create_pdf.py' \
  --exclude 'skrip' \
  --exclude 'hosting' \
  --exclude 'New folder*' \
  --exclude 'UPLOAD-*' \
  --exclude 'rest-api.zip' \
  "${LOCAL_DIR}/index.html" \
  "${LOCAL_DIR}/knowledge.html" \
  "${LOCAL_DIR}/login.html" \
  "${LOCAL_DIR}/dashboard.html" \
  "${LOCAL_DIR}/assets/" \
  "${EC2_USER}@${EC2_HOST}:${REMOTE_DOCROOT}/"

# 4. Set permission yang benar
echo "[4/5] Set permission..."
ssh -i "${EC2_KEY}" "${EC2_USER}@${EC2_HOST}" \
  "sudo chown -R www-data:www-data ${REMOTE_DOCROOT} && \
   sudo find ${REMOTE_DOCROOT} -type d -exec chmod 755 {} \; && \
   sudo find ${REMOTE_DOCROOT} -type f -exec chmod 644 {} \;"

# 5. Reload Nginx
echo "[5/5] Reload Nginx..."
ssh -i "${EC2_KEY}" "${EC2_USER}@${EC2_HOST}" \
  "sudo nginx -t && sudo systemctl reload nginx"

echo
echo "✓ Deployment selesai."
echo "  Akses: http://${EC2_HOST}/"
echo "  Verifikasi: DOMAIN=${EC2_HOST} bash scripts/smoke-test.sh"
