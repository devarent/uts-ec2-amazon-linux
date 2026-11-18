#!/usr/bin/env bash
# ======================================================================
#  setup-httpd.sh  —  Amazon Linux 2023 (VM-1 / "Instance EC2")
#  Install + aktifkan web server, konfigurasi firewall, deploy halaman server
# ======================================================================
set -euo pipefail

DOC_ROOT="/usr/share/httpd/html"
INDEX_NAME="index.html"

echo "=============================================="
echo " [1/5] Update paket (dnf)"
echo "=============================================="
sudo dnf update -y

echo "=============================================="
echo " [2/5] Install httpd (Apache untuk Amazon Linux)"
echo "=============================================="
sudo dnf install -y httpd curl-minimal
sudo systemctl enable httpd
sudo systemctl start httpd

echo "=============================================="
echo " [3/5] Firewall (firewalld) — emulasi Security Group"
echo "=============================================="
if systemctl list-unit-files | grep -q '^firewalld'; then
  sudo systemctl enable --now firewalld
  sudo firewall-cmd --permanent --add-service=http
  sudo firewall-cmd --permanent --add-service=ssh
  sudo firewall-cmd --reload
  sudo firewall-cmd --list-all
else
  echo "firewalld tidak terpasang, lewati (gunakan SG/UFW sesuai OS)."
fi

echo "=============================================="
echo " [4/5] Taruh halaman server ke DocumentRoot"
echo "=============================================="
sudo mkdir -p "$DOC_ROOT"
if [ -f "server-info.html" ]; then
  sudo cp server-info.html "$DOC_ROOT/$INDEX_NAME"
  echo "  --> disalin: server-info.html -> $DOC_ROOT/$INDEX_NAME"
else
  sudo tee "$DOC_ROOT/$INDEX_NAME" >/dev/null <<'EOF'
<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8">
<title>Server EC2 (Amazon Linux) — Muhammad Arya Fatthurahman</title></head>
<body>
<h1>Server Aktif</h1>
<p>Nama: Muhammad Arya Fatthurahman — NIM 2023230006 — Kelas TIFM</p>
<p>Universitas Darma Persada (UNSADA) — Teknologi Informasi</p>
<p>Instance: Amazon Linux 2023 di VMware/VirtualBox — web server: httpd (Apache)</p>
</body></html>
EOF
  echo "  --> halaman default dibuat."
fi
sudo chown -R apache:apache "$DOC_ROOT"
sudo find "$DOC_ROOT" -type d -exec chmod 755 {} \;
sudo find "$DOC_ROOT" -type f -exec chmod 644 {} \;

echo "=============================================="
echo " [5/5] Verifikasi"
echo "=============================================="
sudo systemctl status httpd --no-pager | head -n 12
sudo ss -tlnp | grep -E ':(80|22)\b' || true
curl -s -o /dev/null -w "HTTP lokal: %{http_code}\n" http://localhost
curl -s http://localhost | grep -i -E "Fatthurahman|2023230006" || echo "(halaman terbuka, cek konten manual)"

echo
echo "URL : http://192.168.56.10/"
echo "SSH: ssh -i ~/.ssh/lab_ec2 ec2-user@192.168.56.10"
