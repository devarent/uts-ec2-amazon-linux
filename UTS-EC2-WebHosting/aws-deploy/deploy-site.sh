#!/usr/bin/env bash
# ============================================================
# deploy-site.sh — unggah portal UTS ke EC2 setelah terraform apply
# ------------------------------------------------------------
# Jalankan dari WSL2 Ubuntu (atau Linux/macOS):
#   bash "UTS-EC2-WebHosting/aws-deploy/deploy-site.sh"
#
# Prasyarat:
#   - terraform apply sudah sukses di folder terraform/
#   - file kunci ada di terraform/keys/<key_name>.pem
#   - Security Group mengizinkan SSH dari IP Anda dan HTTP dari internet
# ============================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
TF_DIR="$HERE/terraform"

KEY_NAME="${KEY_NAME:-uts-ec2-aryaf}"
KEY_FILE="${KEY_FILE:-$TF_DIR/keys/$KEY_NAME.pem}"
REMOTE_USER="${REMOTE_USER:-ubuntu}"

if [[ ! -f "$KEY_FILE" ]]; then
  echo "Kunci tidak ditemukan: $KEY_FILE" >&2
  echo "Set KEY_FILE=/path/ke/key.pem atau jalankan terraform apply lebih dulu." >&2
  exit 1
fi

IP="$(cd "$TF_DIR" && terraform output -raw public_ip)"
if [[ -z "$IP" ]]; then
  echo "Gagal membaca public_ip dari terraform output." >&2
  exit 1
fi

echo "==> Target: $REMOTE_USER@$IP"
echo "==> Menyiapkan direktori di server"
ssh -o StrictHostKeyChecking=accept-new -i "$KEY_FILE" "$REMOTE_USER@$IP" \
  "sudo mkdir -p /var/www/uts && sudo chown -R $REMOTE_USER:$REMOTE_USER /var/www/uts"

echo "==> Mengunggah halaman dan assets"
scp -i "$KEY_FILE" \
  "$ROOT/index.html" \
  "$ROOT/knowledge.html" \
  "$ROOT/login.html" \
  "$ROOT/dashboard.html" \
  "$REMOTE_USER@$IP:/var/www/uts/"

scp -r -i "$KEY_FILE" "$ROOT/assets" "$REMOTE_USER@$IP:/var/www/uts/"

echo "==> Memasang virtual host Apache2"
ssh -i "$KEY_FILE" "$REMOTE_USER@$IP" 'bash -s' <<'REMOTE'
set -euo pipefail

sudo tee /etc/apache2/sites-available/uts.conf >/dev/null <<'APACHE'
<VirtualHost *:80>
    ServerName _default_
    DocumentRoot /var/www/uts

    <Directory /var/www/uts>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/uts-error.log
    CustomLog ${APACHE_LOG_DIR}/uts-access.log combined
</VirtualHost>
APACHE

sudo chown -R www-data:www-data /var/www/uts
sudo find /var/www/uts -type d -exec chmod 755 {} \;
sudo find /var/www/uts -type f -exec chmod 644 {} \;

sudo a2dissite 000-default.conf >/dev/null 2>&1 || true
sudo a2ensite uts.conf >/dev/null
sudo apache2ctl configtest
sudo systemctl reload apache2

echo "--- smoke test lokal ---"
curl -s -o /dev/null -w 'index      %{http_code}\n' http://127.0.0.1/
curl -s -o /dev/null -w 'knowledge  %{http_code}\n' http://127.0.0.1/knowledge.html
curl -s -o /dev/null -w 'login      %{http_code}\n' http://127.0.0.1/login.html
curl -s -o /dev/null -w 'dashboard  %{http_code}\n' http://127.0.0.1/dashboard.html
curl -s -o /dev/null -w 'css        %{http_code}\n' http://127.0.0.1/assets/css/portal.css
REMOTE

echo
echo "==> Selesai. Buka dari perangkat lain (bukan localhost):"
echo "    http://$IP/"
echo "    http://$IP/knowledge.html"
echo "    http://$IP/login.html"
