#!/usr/bin/env bash
# ------------------------------------------------------------------
# Script untuk membuat WSL2 dapat diakses dari jaringan LAN
#   Dijalankan dari PowerShell (as administrator) atau bash di WSL2
#   Tujuan: agar WSL2 Nginx bisa diakses dari HP/laptop lain di WiFi
# ------------------------------------------------------------------
set -euo pipefail

echo "=== Setup WSL2 untuk Akses LAN ==="
echo

# Cek apakah dijalankan dari WSL2 atau Windows
if grep -qi microsoft /proc/version 2>/dev/null; then
  echo "Deteksi: Berjalan di dalam WSL2"
  echo "Langkah yang perlu dilakukan dari PowerShell (as administrator):"
  echo
  echo "  1. Cari IP Windows:"
  echo "     ipconfig"
  echo
  echo "  2. Teruskan port Windows -> WSL2:"
  echo "     netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=80 connectaddress=127.0.0.1"
  echo
  echo "  3. Izinkan di firewall:"
  echo "     New-NetFirewallRule -DisplayName 'WSL UTS 8080' -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow"
  echo
  echo "  4. Akses dari HP: http://<IP-WINDOWS>:8080"
  echo
  echo "  5. Hapus aturan setelah selesai:"
  echo "     netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=0.0.0.0"
  echo "     Remove-NetFirewallRule -DisplayName 'WSL UTS 8080'"
  echo
  echo "Untuk menjalankan otomatis dari PowerShell, copy perintah berikut:"
  echo
  cat <<'EOF'
$wslIP = wsl hostname -I
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=80 connectaddress=$wslIP
New-NetFirewallRule -DisplayName "WSL UTS 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
EOF
else
  echo "Deteksi: Berjalan di Windows"
  echo "Pastikan script ini dijalankan dari PowerShell (as administrator)"
  echo
  echo "Mengambil IP WSL2..."
  WSL_IP=$(wsl hostname -I | awk '{print $1}')
  echo "WSL IP: ${WSL_IP}"
  echo

  echo "Menambahkan port proxy..."
  netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=80 connectaddress="${WSL_IP}"

  echo "Menambahkan firewall rule..."
  New-NetFirewallRule -DisplayName "WSL UTS 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow

  echo
  echo "✓ Setup selesai."
  echo "  Akses dari perangkat lain: http://<IP-WINDOWS>:8080"
  echo "  Cek IP Windows dengan: ipconfig"
  echo
  echo "Untuk menghapus aturan:"
  echo "  netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=0.0.0.0"
  echo "  Remove-NetFirewallRule -DisplayName 'WSL UTS 8080'"
fi
