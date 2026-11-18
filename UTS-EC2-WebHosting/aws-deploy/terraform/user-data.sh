#!/usr/bin/env bash
# cloud-init: dijalankan sekali saat instance pertama boot
# Tujuan: setup web server untuk static site UTS Cloud Computing
set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive

# 1. Update dan install paket
apt-get update -y
apt-get install -y nginx apache2-utils curl git jq htop ufw

# 2. Buat direktori docroot
mkdir -p /var/www/uts
chown -R www-data:www-data /var/www/uts

# 3. Hapus halaman default Nginx
rm -f /usr/share/nginx/html/index.html

# 4. Buat halaman placeholder sementara (akan di-replace dengan rsync/scp)
cat > /usr/share/nginx/html/index.html <<'EOF'
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>UTS Cloud Computing - Muhammad Arya Fatthurahman</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 100px auto; padding: 20px; line-height: 1.6; }
    h1 { color: #2563eb; }
    .badge { background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 999px; font-size: 14px; }
  </style>
</head>
<body>
  <h1>UTS Cloud Computing</h1>
  <p><strong>Muhammad Arya Fatthurahman</strong> &middot; NIM 2023230006 &middot; TIFM</p>
  <p>S1 Teknologi Informasi, Universitas Darma Persada</p>
  <hr>
  <p><span class="badge">BOOTSTRAP SELESAI</span></p>
  <p>Instance EC2 sudah siap. Langkah berikutnya:</p>
  <ol>
    <li>SSH ke instance dan unggah file statis (index.html, assets/, knowledge.html, login.html, dashboard.html)</li>
    <li>Copy ke <code>/var/www/uts/</code> atau <code>/usr/share/nginx/html/</code></li>
    <li>Reload Nginx: <code>sudo systemctl reload nginx</code></li>
    <li>Uji akses dari browser: <code>http://<span id="ip">IP-PUBLIK</span>/</code></li>
  </ol>
  <p><em>Halaman ini akan diganti dengan portofolio lengkap setelah deployment.</em></p>
  <script>
    document.getElementById('ip').textContent = location.host;
  </script>
</body>
</html>
EOF

# 5. Konfigurasi Nginx untuk situs statis
cat > /etc/nginx/sites-available/uts <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /var/www/uts;
    index index.html;

    access_log /var/log/nginx/uts-access.log;
    error_log  /var/log/nginx/uts-error.log;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(css|js|jpg|jpeg|png|svg|webp|ico|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }

    # Health check untuk monitoring
    location = /healthz {
        return 200 "ok\n";
        add_header Content-Type text/plain;
    }
}
EOF

# 6. Aktifkan konfigurasi
ln -sf /etc/nginx/sites-available/uts /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 7. Test dan reload Nginx
nginx -t
systemctl enable --now nginx

# 8. Firewall (opsional, Security Group AWS sudah mengatur)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 9. Info bootstrap
echo "========================================" > /var/log/uts-bootstrap.log
echo "Cloud-init selesai: $(date -u +%FT%TZ)" >> /var/log/uts-bootstrap.log
echo "Public IP: $(curl -s http://checkip.amazonaws.com || echo 'unknown')" >> /var/log/uts-bootstrap.log
echo "========================================" >> /var/log/uts-bootstrap.log
echo "Instance siap untuk deployment file statis." >> /var/log/uts-bootstrap.log
