#!/usr/bin/env bash
# =====================================================================
#  cek-deploy.sh
#  Script pengujian (Bagian D - Pengujian) yang dijalankan di server
#  Jalankan di server : bash cek-deploy.sh
# =====================================================================
set -uo pipefail

PUBLIC_IP="${1:-}"
echo "=============================================="
echo "  LAPORAN PENGUJIAN DEPLOYMENT"
echo "=============================================="

echo "--- 1. Status instance & sistem ---"
hostnamectl 2>/dev/null | head -n 4
echo "User yang sedang login : $(whoami)"
echo "Uptime                 : $(uptime -p)"

echo
echo "--- 2. Alamat IP server ---"
echo "Private IP : $(hostname -I | awk '{print $1}')"
if [ -n "$PUBLIC_IP" ]; then
  echo "Public IP  : $PUBLIC_IP"
else
  echo "Public IP  : (isi argumen: bash cek-deploy.sh <PUBLIC-IP>)"
fi

echo
echo "--- 3. Status web server ---"
for svc in apache2 nginx; do
  if systemctl list-unit-files | grep -q "^$svc.service"; then
    printf "%-8s : %s\n" "$svc" "$(systemctl is-active $svc)"
  fi
done

echo
echo "--- 4. Listening port ---"
sudo ss -tlnp 2>/dev/null | grep -E ':(80|22)\b' || netstat -tlnp 2>/dev/null | grep -E ':(80|22)'

echo
echo "--- 5. Uji HTTP lokal ---"
curl -s -o /dev/null -w "http://localhost  -> HTTP %{http_code}\n" http://localhost

if [ -n "$PUBLIC_IP" ]; then
  echo
  echo "--- 6. Uji HTTP via Public IP ---"
  curl -s -o /dev/null -w "http://$PUBLIC_IP -> HTTP %{http_code}\n" "http://$PUBLIC_IP"
fi

echo
echo "--- 7. Cek isi website (nama & NIM) ---"
if curl -s http://localhost | grep -qi "2023230006"; then
  echo "OK  : NIM 2023230006 ditemukan pada halaman."
else
  echo "WARN: NIM tidak ditemukan. Pastikan file index.html ter-upload."
fi

echo
echo "--- 8. Firewall (ufw) ---"
sudo ufw status 2>/dev/null || echo "ufw belum terpasang / tidak aktif"

echo
echo "=============================================="
echo "  Checklist:"
echo "  [ ] Instance EC2 berstatus Running"
echo "  [ ] Security Group: inbound SSH(22) + HTTP(80)"
echo "  [ ] Website terbuka via http://<PUBLIC-IP>"
echo "  [ ] Nama lengkap & NIM tampil di halaman"
echo "=============================================="
