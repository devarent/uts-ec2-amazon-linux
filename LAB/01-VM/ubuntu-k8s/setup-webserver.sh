#!/usr/bin/env bash
# ======================================================================
#  setup-webserver.sh  —  Ubuntu 24.04 (VM-2 / worker Kubernetes)
#  Install apache2 + Docker + k3s (single-node Kubernetes)
# ======================================================================
set -euo pipefail

echo "=============================================="
echo " [1/5] Update & install Apache2 + tools"
echo "=============================================="
sudo apt update -y
sudo apt upgrade -y
sudo apt install -y apache2 curl git ca-certificates gnupg lsb-release iptables-persistent

echo "=============================================="
echo " [2/5] Aktifkan Apache2 (web server)"
echo "=============================================="
sudo systemctl enable --now apache2
sudo systemctl status apache2 --no-pager | head -n 12

echo "=============================================="
echo " [3/5] Install Docker Engine"
echo "=============================================="
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
ARCH="$(dpkg --print-architecture)"
echo "deb [arch=$ARCH signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt update -y
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
sudo systemctl enable --now docker

echo "=============================================="
echo " [4/5] Install k3s (Kubernetes single-node)"
echo "=============================================="
curl -sfL https://get.k3s.io | sh -
echo "Tunggu k3s siap..."
sleep 15
sudo k3s kubectl get nodes || true

echo "=============================================="
echo " [5/5] Buka port (emulasi Security Group)"
echo "=============================================="
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 6443/tcp     # k3s API
sudo ufw allow 30000:32767/tcp   # NodePort range
sudo ufw status verbose || true

echo
echo "URL Apache : http://192.168.56.20/"
echo "kubectl    : sudo k3s kubectl get nodes"
echo "NodePort   : http://192.168.56.20:30080/"
