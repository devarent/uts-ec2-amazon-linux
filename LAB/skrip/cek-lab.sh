#!/usr/bin/env bash
# ======================================================================
#  cek-lab.sh — Health check menyeluruh environment lab UTS
#  Jalankan di WSL2:  bash LAB/skrip/cek-lab.sh
# ======================================================================
set -uo pipefail

PASS=0; FAIL=0
ok()   { printf "  [\033[32mOK\033[0m] %s\n" "$1"; PASS=$((PASS+1)); }
bad()  { printf "  [\033[31m!!\033[0m] %s\n" "$1"; FAIL=$((FAIL+1)); }
head() { printf "\n=== %s ===\n" "$1"; }

VM1="192.168.56.10"
VM2="192.168.56.20"
KEY="${HOME}/.ssh/lab_ec2"

head "1. Tool di WSL2"
for t in docker terraform kubectl kind aws ssh; do
  command -v "$t" >/dev/null && ok "$t terpasang" || bad "$t BELUM terpasang (lihat LAB/02-WSL2)"
done
docker info >/dev/null 2>&1 && ok "Docker daemon berjalan" || bad "Docker daemon mati — 'sudo service docker start'"

head "2. VM-1 (Amazon Linux / EC2) via SSH"
if [ -f "$KEY" ]; then
  ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i "$KEY" ec2-user@"$VM1" 'hostname -I | awk "{print \$1}"' >/dev/null 2>&1 \
    && ok "SSH ke $VM1 (ec2-user)" || bad "SSH ke $VM1 gagal"
else
  bad "Key $KEY tidak ada — buat dengan ssh-keygen (LAB/01-VM)"
fi

head "3. Web server VM-1"
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://$VM1/" || true)
[ "$CODE" = "200" ] && ok "http://$VM1 -> HTTP $CODE" || bad "http://$VM1 -> HTTP ${CODE:-timeout}"

head "4. VM-2 (Ubuntu / worker K8s) via SSH"
if [ -f "$KEY" ]; then
  ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i "$KEY" ubuntu@"$VM2" 'hostname -I | awk "{print \$1}"' >/dev/null 2>&1 \
    && ok "SSH ke $VM2 (ubuntu)" || bad "SSH ke $VM2 gagal (opsional bila RAM minim)"
fi

head "5. Docker website (host 8080)"
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:8080/" || true)
[ "$CODE" = "200" ] && ok "http://localhost:8080 -> HTTP $CODE" || bad "http://localhost:8080 -> HTTP ${CODE:-timeout} — jalankan: docker compose -f LAB/03-DOCKER/docker-compose.yml up -d"

head "6. Kubernetes (kind)"
if command -v kind >/dev/null; then
  kind get clusters 2>/dev/null | grep -q uts-k8s \
    && ok "kind cluster 'uts-k8s' ada" || bad "kind cluster 'uts-k8s' belum ada — kind create cluster --config LAB/05-KUBERNETES/kind-cluster.yaml"
  kubectl -n uts get pods --no-headers 2>/dev/null | grep -q Running \
    && ok "Pod website Running di namespace uts" || bad "Pod uts belum Running — kubectl apply -k LAB/05-KUBERNETES/manifests/"
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:8080/" || true)
else
  bad "kind tidak terpasang"
fi

head "7. LocalStack (simulasi AWS)"
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:4566/_localstack/health" || true)
[ "$CODE" = "200" ] && ok "LocalStack sehat (:4566)" || bad "LocalStack mati — docker compose -f LAB/04-TERRAFORM/localstack/docker-compose.yaml up -d"

head "8. Aset website"
[ -f "index.html" ] && grep -q "2023230006" index.html \
  && ok "index.html berisi NIM 2023230006" || bad "index.html tidak ada / tidak berisi NIM"
[ -f "assets/img/foto-profil.jpg" ] && ok "foto profil tersedia" || bad "assets/img/foto-profil.jpg tidak ada"

head "LAPORAN"
echo "  Lulus: $PASS   Gagal: $FAIL"
[ "$FAIL" -eq 0 ] && echo "  Status: SEMUA BAGIAN LAB SIAP DEMO." || echo "  Status: ada bagian yang perlu diperbaiki (lihat pesan di atas)."
