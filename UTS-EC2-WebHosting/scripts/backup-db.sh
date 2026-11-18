#!/usr/bin/env bash
# ------------------------------------------------------------------
# Backup PostgreSQL ke file custom-format pg_dump.
# Dipasang oleh setup-ec2.sh sebagai cron harian 03:30.
#   bash scripts/backup-db.sh
# ------------------------------------------------------------------
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/app}"
BACKUP_DIR="${BACKUP_DIR:-${APP_DIR}/backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"

cd "${APP_DIR}"
mkdir -p "${BACKUP_DIR}"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="${BACKUP_DIR}/ec2lab-${STAMP}.dump"

echo "==> Backup database ke ${FILE}"
docker compose exec -T db sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-acl' \
  >"${FILE}"

chmod 600 "${FILE}"
# Cron berjalan sebagai root; samakan owner dengan pemilik direktori app
# supaya user deploy bisa mengunduh file backup lewat scp.
chown "$(stat -c '%u:%g' "${APP_DIR}")" "${FILE}" 2>/dev/null || true
find "${BACKUP_DIR}" -type f -name 'ec2lab-*.dump' -mtime +"${KEEP_DAYS}" -delete

echo "Backup OK: ${FILE} ($(du -h "${FILE}" | cut -f1))"
