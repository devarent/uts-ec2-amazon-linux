#!/bin/bash
# Setup server mirip EC2 di WSL Ubuntu:
#  - copy website ke /var/www/uts-lab
#  - chown/chmod permission
#  - nginx server block port 80 -> document root
set -uo pipefail
SRC="/mnt/c/laragon/www/UTS Ujian Tengah Semester EC2 Amazon Linux"
DOC=/var/www/uts-lab

echo "=== 1. Copy website ==="
mkdir -p "$DOC"
cp -r "$SRC/." "$DOC/"
echo "Isi document root:"
ls -la "$DOC"

echo "=== 2. Permission (owner web server) ==="
WEBUSER=nginx; id www-data >/dev/null 2>&1 && WEBUSER=www-data
chown -R "$WEBUSER:$WEBUSER" "$DOC"
if [ $? -ne 0 ]; then chown -R nginx:nginx "$DOC"; fi
find "$DOC" -type d -exec chmod 755 {} \;
find "$DOC" -type f -exec chmod 644 {} \;
echo "owner: $WEBUSER"; ls -ld "$DOC"

echo "=== 3. Konfig Nginx (document root) ==="
cat > /etc/nginx/sites-available/uts-lab <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root /var/www/uts-lab;
    index index.html;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        try_files $uri $uri/ =404;
    }
    location ~ /\. {
        deny all;
    }
}
EOF

ln -sf /etc/nginx/sites-available/uts-lab /etc/nginx/sites-enabled/uts-lab
rm -f /etc/nginx/sites-enabled/default

echo "=== 4. Test konfig & reload ==="
nginx -t && nginx -s reload && sleep 1 && echo "NGINX RELOADED"

echo "=== 5. Verifikasi ==="
curl -s -o /dev/null -w "HTTP http://localhost -> %{http_code}\n" http://localhost/
curl -s http://localhost/ | grep -m1 -E "2023230006|Fatthurahman" | sed 's/^/   HTML has -> /'
ss -tlnp | grep ':80 '

echo "=== 6. Apache2 test di port 8081 (bandingkan document root) ==="
cat > /etc/apache2/sites-available/uts-lab.conf <<'EOF'
Listen 8081
<VirtualHost *:8081>
    ServerName localhost
    DocumentRoot /var/www/uts-lab
    <Directory /var/www/uts-lab>
        Options Indexes FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>
</VirtualHost>
EOF
a2ensite uts-lab >/dev/null 2>&1 || true
apache2ctl -t && systemctl reload apache2 2>&1 && echo "APACHE2 RELOADED (port 8081)" || echo "(apache2 tidak reload - coba manual)"
curl -s -o /dev/null -w "HTTP http://localhost:8081 -> %{http_code}\n" http://localhost:8081/ || true
