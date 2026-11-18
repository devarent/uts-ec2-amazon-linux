# =====================================================================
#  deploy.sh
#  Menyalin website statis ke document root web server
#  Jalankan DI DALAM SERVER setelah file di-upload (scp/rsync):
#      cd ~/website && bash deploy.sh
#
#  Variabel lingkungan (opsional):
#      WEB_USER=www-data   WEB_GROUP=www-data
#      WEB_ROOT=/var/www/html
#      SERVICE=apache2     # atau nginx
# =====================================================================
set -euo pipefail

WEB_USER="${WEB_USER:-www-data}"
WEB_GROUP="${WEB_GROUP:-www-data}"
WEB_ROOT="${WEB_ROOT:-var/www/html}"
SERVICE="${SERVICE:-apache2}"

echo "=== 1. Pastikan document root ada ==="
sudo mkdir -p "$WEB_ROOT"

echo "=== 2. Backup website lama (jika ada) ==="
if [ -f "$WEB_ROOT/index.html" ]; then
  sudo cp -a "$WEB_ROOT" "$WEB_ROOT.backup.$(date +%Y%m%d%H%M%S)"
  echo "  backup: $WEB_ROOT.backup.*"
fi

echo "=== 3. Upload (copy) seluruh file website ==="
# . = folder tempat index.html berada
sudo cp -rv ./* "$WEB_ROOT"/

echo "=== 4. Atur ownership & permission ==="
sudo chown -R "$WEB_USER":"$WEB_GROUP" "$WEB_ROOT"
sudo find "$WEB_ROOT" -type d -exec chmod 755 {} \;
sudo find "$WEB_ROOT" -type f -exec chmod 644 {} \;

echo "=== 5. Restart/reload web server ==="
sudo systemctl reload "$SERVICE" 2>/dev/null || sudo systemctl restart "$SERVICE"
sudo systemctl status "$SERVICE" --no-pager | head -n 10

echo "=== 6. Uji respons HTTP lokal ==="
curl -s -o /dev/null -w "HTTP Status : %{http_code}\n" http://localhost
curl -s http://localhost | grep -i -m1 -E "Fatthurahman|2023230006" && echo "  -> Nama & NIM ditemukan di halaman."

echo
echo "=== Selesai. Buka di browser: http://<PUBLIC-IP-EC2> ==="
