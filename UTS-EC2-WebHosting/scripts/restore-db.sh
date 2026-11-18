#!/usr/bin/env bash
# ------------------------------------------------------------------
# Restore backup PostgreSQL. Data saat ini akan ditimpa.
#   bash scripts/restore-db.sh backups/ec2lab-20260101T033000Z.dump
# ------------------------------------------------------------------
set -euo pipefail

FILE="${1:?Pemakaian: bash scripts/restore-db.sh backups/ec2lab-YYYYMMDDTHHMMSSZ.dump}"
APP_DIR="${APP_DIR:-/opt/app}"

cd "${APP_DIR}"

if [[ ! -f "${FILE}" ]]; then
  echo "ERROR: file backup tidak ditemukan: ${FILE}" >&2
  exit 1
fi

read -r -p "Restore ${FILE} ke database? Data saat ini akan ditimpa. [y/N] " answer
if [[ ! "${answer}" =~ ^[Yy]$ ]]; then
  echo "Dibatalkan."
  exit 1
fi

echo "==> Restore ${FILE}"
docker compose exec -T db sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-acl --single-transaction' \
  <"${FILE}"

echo "Restore selesai."
