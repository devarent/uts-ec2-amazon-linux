#!/usr/bin/env bash
# ------------------------------------------------------------------
# Bootstrap EC2 Amazon Linux 2023 (juga mendukung Debian/Ubuntu untuk lab lama).
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

. /etc/os-release
echo "==> Sistem operasi: ${PRETTY_NAME:-$ID}"

case "${ID}" in
  amzn)
    dnf upgrade -y
    dnf install -y ca-certificates curl git jq unzip htop vim cronie docker
    systemctl enable --now docker crond
    ;;
  debian|ubuntu)
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y
    apt-get upgrade -y
    apt-get install -y ca-certificates curl gnupg git jq unzip htop vim ufw unattended-upgrades cron
    dpkg-reconfigure -f noninteractive unattended-upgrades || true
    if ! command -v docker >/dev/null 2>&1; then
      curl -fsSL https://get.docker.com | sh
    fi
    systemctl enable --now docker cron
    ;;
  *)
    echo "OS tidak didukung: ${ID}. Gunakan Amazon Linux 2023, Debian, atau Ubuntu." >&2
    exit 1
    ;;
esac

echo "==> Pastikan Docker Compose v2 tersedia"
if ! docker compose version >/dev/null 2>&1; then
  if [[ "${ID}" == "amzn" ]]; then
    dnf install -y docker-compose-plugin || true
  else
    apt-get install -y docker-compose-plugin
  fi
fi
if ! docker compose version >/dev/null 2>&1; then
  compose_tag="$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest | jq -r '.tag_name')"
  compose_arch="$(uname -m)"
  install -d -m 0755 /usr/local/lib/docker/cli-plugins
  curl -fsSL "https://github.com/docker/compose/releases/download/${compose_tag}/docker-compose-linux-${compose_arch}" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod 0755 /usr/local/lib/docker/cli-plugins/docker-compose
fi
docker compose version

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

if [[ "${ID}" == "debian" || "${ID}" == "ubuntu" ]]; then
  echo "==> Firewall host (ufw) — hanya 22/80/443"
  ufw allow OpenSSH >/dev/null || ufw allow 22/tcp >/dev/null
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
  ufw --force enable >/dev/null
else
  echo "==> Firewall host mengikuti Security Group AWS (22 terbatas, 80/443 publik)"
fi

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
echo "Selesai untuk ${PRETTY_NAME:-$ID}."
echo "  1. Logout & login lagi (agar grup docker aktif), atau: newgrp docker"
echo "  2. Jika repo belum ada: git clone <repo> ${APP_DIR}"
echo "  3. cp .env.example .env && nano .env"
echo "  4. sudo bash scripts/issue-cert.sh   (butuh domain + port 80)"
echo "  5. docker compose up -d"
