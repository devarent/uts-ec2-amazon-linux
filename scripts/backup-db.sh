#!/usr/bin/env bash
# ------------------------------------------------------------------
# Backup database PostgreSQL (jika memakai path dinamis Next.js)
#   Penggunaan:
#     DB_HOST=127.0.0.1 DB_PORT=5433 DB_NAME=ec2lab DB_USER=ec2lab bash scripts/backup-db.sh
#   atau dari Docker Compose:
#     docker compose exec -T db pg_dump -U ec2lab ec2lab > backups/ec2lab-$(date +%Y%m%d-%H%M%S).sql
# ------------------------------------------------------------------
set -euo pipefail

# Konfigurasi
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5433}"
DB_NAME="${DB_NAME:-ec2lab}"
DB_USER="${DB_USER:-ec2lab}"
BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}-${TIMESTAMP}.sql"

# Buat direktori backup
mkdir -p "${BACKUP_DIR}"

echo "=== Backup Database PostgreSQL ==="
echo "Host: ${DB_HOST}:${DB_PORT}"
echo "Database: ${DB_NAME}"
echo "User: ${DB_USER}"
echo "Output: ${BACKUP_FILE}"
echo

# Cek pg_dump
if ! command -v pg_dump &> /dev/null; then
  echo "Error: pg_dump tidak ditemukan."
  echo "  Install: sudo apt install postgresql-client"
  echo "  Atau gunakan: docker compose exec -T db pg_dump -U ${DB_USER} ${DB_NAME} > backup.sql"
  exit 1
fi

# Jalankan backup
echo "Memulai backup..."
PGPASSWORD="${DB_PASSWORD:-}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=plain \
  --no-owner \
  --no-acl \
  > "${BACKUP_FILE}"

# Kompresi
gzip "${BACKUP_FILE}"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Ukuran file
SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)

echo
echo "✓ Backup selesai."
echo "  File: ${BACKUP_FILE}"
echo "  Ukuran: ${SIZE}"
echo
echo "Restore dengan:"
echo "  gunzip -c ${BACKUP_FILE} | psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME}"
