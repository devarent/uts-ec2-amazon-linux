#!/usr/bin/env bash
# ------------------------------------------------------------------
# Script untuk verifikasi koneksi database dan menampilkan status
# ------------------------------------------------------------------
set -euo pipefail

echo "==> Checking PostgreSQL database status..."

# Check if container is running
if ! docker compose ps db | grep -q "Up"; then
  echo "ERROR: Database container is not running"
  echo "Start it with: docker compose up -d db"
  exit 1
fi

echo "==> Database container is running"
echo ""

# Load environment variables
if [[ -f .env ]]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "ERROR: .env file not found"
  exit 1
fi

echo "==> Testing database connection..."
docker compose exec -T db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT version();" || {
  echo "ERROR: Failed to connect to database"
  exit 1
}

echo ""
echo "==> Database connection successful!"
echo ""

echo "==> Listing tables..."
docker compose exec -T db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "\dt" || echo "No tables found yet"

echo ""
echo "==> Database info:"
echo "    Database: ${POSTGRES_DB}"
echo "    User: ${POSTGRES_USER}"
echo "    Port: 5433 (localhost) -> 5432 (container)"
echo ""
echo "==> To connect manually:"
echo "    docker compose exec db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}"
echo ""
echo "==> To start Adminer (database UI):"
echo "    docker compose --profile tools up -d adminer"
echo "    Then open: http://localhost:8090"
