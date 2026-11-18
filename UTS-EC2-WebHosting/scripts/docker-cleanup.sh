#!/usr/bin/env bash
# ------------------------------------------------------------------
# Bersihkan resource Docker yang tidak terpakai. Aman dijalankan harian.
# ------------------------------------------------------------------
set -euo pipefail

echo "=== Docker cleanup $(date -u +%FT%TZ) ==="

docker container prune -f
docker image prune -af --filter "until=24h"
docker builder prune -af --filter "until=24h"
docker network prune -f

# Volume TIDAK dihapus otomatis: bisa berisi data.
# docker volume prune -f

echo "=== Disk ==="
df -h / | tail -n 1
echo "=== Docker ==="
docker system df
echo "=== Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
