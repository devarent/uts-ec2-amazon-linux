#!/usr/bin/env bash
# ------------------------------------------------------------------
# Restore database PostgreSQL dari backup
#   Penggunaan:
#     DB_HOST=127.0.0.1 DB_PORT=5433 DB_NAME=ec2lab DB_USER=ec2lab \
#     BACKUP_FILE=backups/ec2lab-20231115-123456.sql.gz \
#     bash scripts/restore-db.sh
# ------------------------------------------------------------------
set -euo pipefail

# Konfigurasi
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5433}"
DB_NAME="${DB_NAME:-ec2lab}"
DB_USER="${DB_USER:-ec2lab}"
BACKUP_FILE="${BACKUP_FILE:-}"

# Validasi
if [[ -z "${BACKUP_FILE}" ]]; then
  echo "Error: BACKUP_FILE belum diset."
  echo "  Contoh: BACKUP_FILE=backups/ec2lab-20231115-123456.sql.gz bash scripts/restore-db.sh"
  exit 1
fi

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Error: File backup tidak ditemukan: ${BACKUP_FILE}"
  exit 1
fi

echo "=== Restore Database PostgreSQL ==="
echo "Host: ${DB_HOST}:${DB_PORT}"
echo "Database: ${DB_NAME}"
echo "User: ${DB_USER}"
echo "Backup: ${BACKUP_FILE}"
echo

# Konfirmasi
read -p "Lanjutkan restore? Ini akan menimpa database saat ini. [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Dibatalkan."
  exit 0
fi

# Restore
if [[ "${BACKUP_FILE}" == *.gz ]]; then
  echo "Restore dari file terkompresi..."
  gunzip -c "${BACKUP_FILE}" | \
    PGPASSWORD="${DB_PASSWORD:-}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}"
else
  echo "Restore dari file SQL..."
  PGPASSWORD="${DB_PASSWORD:-}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -f "${BACKUP_FILE}"
fi

echo
echo "✓ Restore selesai."
echo "  Database ${DB_NAME} telah di-restore dari ${BACKUP_FILE}"
