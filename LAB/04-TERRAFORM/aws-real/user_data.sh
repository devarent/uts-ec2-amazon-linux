#!/bin/bash
# ======================================================================
#  user_data.sh — dijalankan otomatis saat instance EC2 pertama kali nyala
# ======================================================================
set -euxo pipefail
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

apt-get update -y
apt-get upgrade -y
DEBIAN_FRONTEND=noninteractive apt-get install -y apache2 curl

systemctl enable --now apache2

# Tulis index.html sederhana (akan ditimpa dengan website lengkap dari repo)
cat > /var/www/html/index.html <<'EOF'
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>UTS Cloud Computing — Muhammad Arya Fatthurahman</title>
</head>
<body>
<h1>Muhammad Arya Fatthurahman</h1>
<p>NIM: 2023230006 &middot; Kelas: TIFM &middot; Program Studi: Teknologi Informasi</p>
<p>Universitas Darma Persada (UNSADA)</p>
<p>Deployed on <strong>AWS EC2 (Ubuntu 24.04) + Apache2</strong> via Terraform.</p>
</body>
</html>
EOF

chown -R www-data:www-data /var/www/html
find /var/www/html -type d -exec chmod 755 {} \;
find /var/www/html -type f -exec chmod 644 {} \;
systemctl reload apache2
