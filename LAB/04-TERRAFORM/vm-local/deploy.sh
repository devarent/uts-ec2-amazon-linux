#!/bin/bash
# ======================================================================
#  deploy.sh (dijalankan "remote" di VM oleh Terraform remote-exec)
#  Bisa untuk Amazon Linux (dnf) maupun Ubuntu/Debian (apt).
# ======================================================================
set -euxo pipefail

echo "== 1. Update package =="
if command -v dnf >/dev/null 2>&1; then
  sudo dnf update -y
  sudo dnf install -y httpd curl
  WEB_SERVICE=httpd
  DOC_ROOT=/usr/share/httpd/html
  WEB_USER=apache
else
  sudo apt update -y
  sudo apt install -y apache2 curl
  WEB_SERVICE=apache2
  DOC_ROOT=/var/www/html
  WEB_USER=www-data
fi

echo "== 2. Aktifkan web server =="
sudo systemctl enable "$WEB_SERVICE"
sudo systemctl start "$WEB_SERVICE"

echo "== 3. Deploy halaman server =="
sudo tee "$DOC_ROOT/index.html" >/dev/null <<'HTML'
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Server Lab UTS — Muhammad Arya Fatthurahman</title>
</head>
<body>
<h1>MUHAMMAD ARYA FATTHURAHMAN</h1>
<p>NIM: 2023230006 &middot; Kelas: TIFM &middot; Teknologi Informasi</p>
<p>Universitas Darma Persada (UNSADA)</p>
<p>Deployed via <strong>Terraform</strong> remote-exec over SSH ke VMware/VirtualBox.</p>
</body>
</html>
HTML

sudo chown -R "$WEB_USER":"$WEB_USER" "$DOC_ROOT"
sudo find "$DOC_ROOT" -type d -exec chmod 755 {} \;
sudo find "$DOC_ROOT" -type f -exec chmod 644 {} \;
sudo systemctl reload "$WEB_SERVICE" || true

echo "== 4. Verifikasi =="
sudo systemctl is-active "$WEB_SERVICE"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost
