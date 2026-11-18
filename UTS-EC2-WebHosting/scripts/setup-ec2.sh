#!/usr/bin/env bash
# ------------------------------------------------------------------
# Bootstrap EC2 (Debian 13 / Ubuntu 24.04) untuk lab ini.
# Jalankan sekali setelah SSH masuk:
#   sudo bash scripts/setup-ec2.sh
# ------------------------------------------------------------------
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Jalankan dengan sudo: sudo bash scripts/setup-ec2.sh" >&2
  exit 1
fi

TARGET_USER="${SUDO_USER:-${USER}}"
APP_DIR="${APP_DIR:-/opt/app}"
SWAP_SIZE="${SWAP_SIZE:-2G}"

echo "==> Update paket"
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

echo "==> Install dependency dasar"
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ca-certificates curl gnupg git jq unzip htop vim ufw unattended-upgrades

echo "==> Aktifkan unattended-upgrades (patch keamanan otomatis)"
dpkg-reconfigure -f noninteractive unattended-upgrades || true

echo "==> Install Docker Engine + Compose v2"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

if ! docker compose version >/dev/null 2>&1; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y docker-compose-plugin
fi

echo "==> Tambahkan ${TARGET_USER} ke grup docker"
usermod -aG docker "${TARGET_USER}"

echo "==> Swap ${SWAP_SIZE} (penting untuk t3.micro 1 GB)"
if ! swapon --show | grep -q .; then
  fallocate -l "${SWAP_SIZE}" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
  sysctl -w vm.swappiness=10 >/dev/null
  grep -q '^vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >>/etc/sysctl.conf
else
  echo "    swap sudah aktif, dilewati"
fi

echo "==> Direktori aplikasi ${APP_DIR}"
mkdir -p "${APP_DIR}" "${APP_DIR}/nginx/certs" "${APP_DIR}/nginx/www" "${APP_DIR}/backups"
chown -R "${TARGET_USER}:${TARGET_USER}" "${APP_DIR}"

echo "==> Firewall host (ufw) — hanya 22/80/443"
# Security Group AWS tetap lapisan utama; ufw adalah lapisan kedua.
ufw allow OpenSSH >/dev/null || ufw allow 22/tcp >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

echo "==> Cron cleanup Docker harian (03:00)"
install -m 0755 "$(dirname "$0")/docker-cleanup.sh" /usr/local/bin/docker-cleanup
cat >/etc/cron.d/docker-cleanup <<'CRON'
0 3 * * * root /usr/local/bin/docker-cleanup >> /var/log/docker-cleanup.log 2>&1
CRON

echo "==> Cron backup database harian (03:30)"
install -m 0755 "$(dirname "$0")/backup-db.sh" /usr/local/bin/backup-db
cat >/etc/cron.d/db-backup <<CRON
30 3 * * * root cd ${APP_DIR} && APP_DIR=${APP_DIR} /usr/local/bin/backup-db >> /var/log/db-backup.log 2>&1
CRON

echo "==> Cron renew sertifikat (02:30 & 14:30)"
install -m 0755 "$(dirname "$0")/renew-cert.sh" /usr/local/bin/renew-cert
cat >/etc/cron.d/letsencrypt-renew <<CRON
30 2,14 * * * root cd ${APP_DIR} && APP_DIR=${APP_DIR} /usr/local/bin/renew-cert >> /var/log/letsencrypt-renew.log 2>&1
CRON

echo
echo "Selesai."
echo "  1. Logout & login lagi (agar grup docker aktif), atau: newgrp docker"
echo "  2. Jika repo belum ada: git clone <repo> ${APP_DIR}"
echo "  3. cp .env.example .env && nano .env"
echo "  4. sudo bash scripts/issue-cert.sh   (butuh domain + port 80)"
echo "  5. docker compose up -d"
