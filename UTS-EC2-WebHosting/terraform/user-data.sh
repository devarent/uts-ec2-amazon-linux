#!/usr/bin/env bash
# Dijalankan sekali saat instance pertama boot (cloud-init).
set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive
APP_DIR="${app_dir}"

apt-get update -y
apt-get install -y ca-certificates curl gnupg git jq unzip htop

# Docker + Compose plugin
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker
apt-get install -y docker-compose-plugin || true

# Swap 2 GB untuk t3.micro
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >>/etc/fstab
  echo 'vm.swappiness=10' >>/etc/sysctl.conf
  sysctl -w vm.swappiness=10
fi

# Direktori deploy
mkdir -p "$${APP_DIR}/nginx/certs" "$${APP_DIR}/nginx/www" "$${APP_DIR}/backups"
chown -R admin:admin "$${APP_DIR}" || true

# Pastikan Docker hidup setelah reboot
systemctl is-enabled docker

echo "cloud-init selesai: $(date -u +%FT%TZ)" >/var/log/ec2-lab-bootstrap.log
