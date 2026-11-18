#!/usr/bin/env bash
# ------------------------------------------------------------------
# Deploy app ke EC2 dengan health check + rollback otomatis.
# Dipanggil oleh GitHub Actions, atau manual:
#   APP_IMAGE=ghcr.io/owner/repo:sha-abc1234 ./scripts/deploy.sh
# ------------------------------------------------------------------
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/app}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/api/health}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-60}"
SLEEP_SECONDS="${SLEEP_SECONDS:-2}"

cd "${APP_DIR}"

if [[ ! -f .env ]]; then
  echo "ERROR: ${APP_DIR}/.env tidak ditemukan. Salin dari .env.example." >&2
  exit 1
fi

if [[ -n "${APP_IMAGE:-}" ]]; then
  export APP_IMAGE
fi

echo "==> Menyimpan image saat ini untuk rollback"
PREVIOUS_IMAGE="$(docker inspect --format '{{.Config.Image}}' ec2-lab-app 2>/dev/null || true)"
if [[ -n "${PREVIOUS_IMAGE}" ]]; then
  echo "${PREVIOUS_IMAGE}" >.previous_image
  echo "    previous: ${PREVIOUS_IMAGE}"
else
  echo "    belum ada container sebelumnya (first deploy)"
fi

echo "==> Pull image terbaru (${APP_IMAGE:-default dari .env})"
docker compose pull app || echo "    WARN: pull gagal; lanjut dengan image lokal bila ada"

echo "==> Recreate container"
docker compose up -d --remove-orphans

echo "==> Menunggu health check (${MAX_ATTEMPTS} x ${SLEEP_SECONDS}s)"
HEALTHY=0
for attempt in $(seq 1 "${MAX_ATTEMPTS}"); do
  if curl -fsS --max-time 3 "${HEALTH_URL}" >/dev/null 2>&1; then
    HEALTHY=1
    echo "    sehat pada percobaan ${attempt}"
    break
  fi
  sleep "${SLEEP_SECONDS}"
done

if [[ "${HEALTHY}" -ne 1 ]]; then
  echo "ERROR: health check gagal. Log terakhir:" >&2
  docker compose logs --tail=80 app >&2 || true

  if [[ -n "${PREVIOUS_IMAGE}" ]]; then
    echo "==> Rollback ke ${PREVIOUS_IMAGE}" >&2
    APP_IMAGE="${PREVIOUS_IMAGE}" docker compose up -d --no-deps app >&2 || true
  else
    echo "==> Tidak ada image sebelumnya; menghentikan app" >&2
    docker compose stop app >&2 || true
  fi

  exit 1
fi

echo "==> Bersihkan image lama (>24 jam)"
docker image prune -f --filter "until=24h" >/dev/null || true

echo "==> Status"
docker compose ps

echo "Deploy sukses: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
