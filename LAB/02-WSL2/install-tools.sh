#!/usr/bin/env bash
# ======================================================================
#  install-tools.sh  —  pasang semua tool DevOps di WSL2 Ubuntu 24.04
#  Jalankan:  bash install-tools.sh
# ======================================================================
set -euo pipefail

echo "=== 1. System update ==="
sudo apt update -y && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg lsb-release apt-transport-https \
  git make unzip jq rsync openssh-client nano vim htop net-tools iputils-ping

echo "=== 2. Docker Engine ==="
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt update -y
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
sudo service docker start || sudo systemctl start docker || true

echo "=== 3. Terraform ==="
wget -qO- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list >/dev/null
sudo apt update -y && sudo apt install -y terraform

echo "=== 4. kubectl ==="
KVER="$(curl -L -s https://dl.k8s.io/release/stable.txt)"
curl -LO "https://dl.k8s.io/release/${KVER}/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm -f kubectl

echo "=== 5. kind ==="
curl -Lo /tmp/kind https://kind.sigs.k8s.io/dl/v0.27.0/kind-linux-amd64
chmod +x /tmp/kind && sudo mv /tmp/kind /usr/local/bin/kind

echo "=== 6. Helm ==="
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

echo "=== 7. AWS CLI v2 ==="
curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
if command -v unzip >/dev/null; then unzip -q /tmp/awscliv2.zip -d /tmp; else sudo apt install -y unzip && unzip -q /tmp/awscliv2.zip -d /tmp; fi
sudo /tmp/aws/install --update
rm -rf /tmp/aws /tmp/awscliv2.zip

echo "=== 8. AWS CLI: credential dummy untuk LocalStack ==="
aws configure set region us-east-1
aws configure set output json
aws configure set aws_access_key_id test
aws configure set aws_secret_access_key test

echo
echo "=============================================="
echo " Selesai. Jalankan ulang terminal / logout."
echo " Verifikasi: docker --version; terraform --version; kubectl version --client; kind version; aws --version"
echo "=============================================="
