#!/usr/bin/env bash
# Dijalankan sekali saat instance pertama boot (cloud-init).
set -euxo pipefail

APP_DIR="${app_dir}"

dnf upgrade -y
dnf install -y ca-certificates curl git jq unzip htop docker

# Docker Engine dari repositori Amazon Linux 2023.
systemctl enable --now docker
usermod -aG docker ec2-user

# Compose v2: gunakan paket bila tersedia, lalu fallback ke rilis resmi Docker.
if ! docker compose version >/dev/null 2>&1; then
  if ! dnf install -y docker-compose-plugin; then
    compose_tag="$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest | jq -r '.tag_name')"
    compose_arch="$(uname -m)"
    install -d -m 0755 /usr/local/lib/docker/cli-plugins
    curl -fsSL "https://github.com/docker/compose/releases/download/$${compose_tag}/docker-compose-linux-$${compose_arch}" \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod 0755 /usr/local/lib/docker/cli-plugins/docker-compose
  fi
fi
docker compose version

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
chown -R ec2-user:ec2-user "$${APP_DIR}" || true

# Pastikan Docker hidup setelah reboot
systemctl is-enabled docker

echo "cloud-init selesai: $(date -u +%FT%TZ)" >/var/log/ec2-lab-bootstrap.log
