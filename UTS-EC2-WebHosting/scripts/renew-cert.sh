#!/usr/bin/env bash
# ------------------------------------------------------------------
# Perpanjang sertifikat dengan webroot, lalu reload nginx.
# Dipasang otomatis oleh setup-ec2.sh sebagai cron 2x/hari.
# ------------------------------------------------------------------
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/app}"
cd "${APP_DIR}"

docker compose --profile tls run --rm \
  --entrypoint certbot \
  certbot renew --webroot -w /var/www/certbot --quiet

# reload hanya jika nginx berjalan
if docker inspect -f '{{.State.Running}}' ec2-lab-nginx 2>/dev/null | grep -q true; then
  docker compose exec -T nginx nginx -s reload
  echo "[$(date -u +%FT%TZ)] certificate check + nginx reload OK"
else
  echo "[$(date -u +%FT%TZ)] nginx tidak berjalan, reload dilewati"
fi
