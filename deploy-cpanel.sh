#!/bin/bash
# Deployment Script untuk cPanel Hosting
# IP: 101.50.1.99
# Domain: aryafatthurahman1.ac.id
# Username: aryafatthur1

set -e

# Konfigurasi
HOST="aryafatthurahman1.ac.id"
USER="aryafatthur1"
REMOTE_DIR="/home/aryafatthur1/public_html"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

# Warna untuk output
green='\033[0;32m'
blue='\033[0;34m'
yellow='\033[1;33m'
red='\033[0;31m'
nc='\033[0m' # No Color

echo -e "${blue}╔══════════════════════════════════════════════════════════════╗${nc}"
echo -e "${blue}║          Deployment Script - cPanel Hosting                 ║${nc}"
echo -e "${blue}╚══════════════════════════════════════════════════════════════╝${nc}"
echo ""
echo -e "${yellow}Server Information:${nc}"
echo "  Host: $HOST"
echo "  IP: 101.50.1.99"
echo "  User: $USER"
echo "  Remote Dir: $REMOTE_DIR"
echo "  Local Dir: $LOCAL_DIR"
echo ""

# Fungsi untuk menampilkan menu
show_menu() {
    echo -e "${blue}Pilih metode deployment:${nc}"
    echo "1) Upload via File Manager (manual instructions)"
    echo "2) Upload via FTP (FileZilla/WinSCP)"
    echo "3) Upload via SCP/SSH (command line)"
    echo "4) Test koneksi ke server"
    echo "5) Setup .htaccess"
    echo "6) Keluar"
    echo ""
    read -p "Pilih opsi (1-6): " choice
}

# Fungsi untuk upload via SCP
upload_scp() {
    echo -e "${blue}=== Upload via SCP ===${nc}"
    echo ""
    echo "Menyiapkan file untuk upload..."
    
    # File yang akan diupload
    FILES=(
        "index.html"
        "knowledge.html"
        "login.html"
        "dashboard.html"
        "README.md"
        "DEPLOYMENT-GUIDE.md"
        "DEPLOY-CPANEL.md"
        ".htaccess"
    )
    
    # Upload HTML files
    for file in "${FILES[@]}"; do
        if [ -f "$LOCAL_DIR/$file" ]; then
            echo -e "${yellow}Uploading $file...${nc}"
            scp "$LOCAL_DIR/$file" "$USER@$HOST:$REMOTE_DIR/"
        fi
    done
    
    # Upload assets folder
    echo -e "${yellow}Uploading assets folder...${nc}"
    scp -r "$LOCAL_DIR/assets" "$USER@$HOST:$REMOTE_DIR/"
    
    echo -e "${green}✓ Upload selesai!${nc}"
    echo ""
}

# Fungsi untuk upload via rsync (lebih cepat)
upload_rsync() {
    echo -e "${blue}=== Upload via rsync ===${nc}"
    echo ""
    
    # Cek apakah rsync tersedia
    if ! command -v rsync &> /dev/null; then
        echo -e "${red}✗ rsync tidak tersedia. Install rsync atau gunakan metode lain.${nc}"
        return 1
    fi
    
    echo "Menggunakan rsync untuk upload (lebih cepat)..."
    
    # Upload files
    rsync -avz --progress \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        "$LOCAL_DIR/" "$USER@$HOST:$REMOTE_DIR/"
    
    echo -e "${green}✓ Upload selesai!${nc}"
    echo ""
}

# Fungsi untuk test koneksi
test_connection() {
    echo -e "${blue}=== Testing Koneksi ===${nc}"
    echo ""
    
    # Test ping
    echo -e "${yellow}Testing ping ke $HOST...${nc}"
    if ping -c 3 "$HOST" &> /dev/null; then
        echo -e "${green}✓ Ping berhasil${nc}"
    else
        echo -e "${red}✗ Ping gagal${nc}"
    fi
    
    # Test SSH
    echo -e "${yellow}Testing SSH connection...${nc}"
    if ssh -o ConnectTimeout=5 -o BatchMode=yes "$USER@$HOST" "echo 'SSH connection successful'" 2>/dev/null; then
        echo -e "${green}✓ SSH berhasil${nc}"
    else
        echo -e "${red}✗ SSH gagal (mungkin perlu password atau key)${nc}"
    fi
    
    # Test HTTP
    echo -e "${yellow}Testing HTTP access...${nc}"
    if curl -s -o /dev/null -w "%{http_code}" "http://$HOST" | grep -q "200\|301\|302"; then
        echo -e "${green}✓ HTTP berhasil${nc}"
    else
        echo -e "${red}✗ HTTP gagal${nc}"
    fi
    
    # Test HTTPS
    echo -e "${yellow}Testing HTTPS access...${nc}"
    if curl -s -o /dev/null -w "%{http_code}" "https://$HOST" | grep -q "200\|301\|302"; then
        echo -e "${green}✓ HTTPS berhasil${nc}"
    else
        echo -e "${yellow}⚠ HTTPS belum aktif (SSL belum diinstall)${nc}"
    fi
    
    echo ""
}

# Fungsi untuk setup .htaccess
setup_htaccess() {
    echo -e "${blue}=== Setup .htaccess ===${nc}"
    echo ""
    
    if [ -f "$LOCAL_DIR/.htaccess" ]; then
        echo -e "${green}✓ File .htaccess sudah ada di project${nc}"
        echo "File akan diupload bersama file lainnya."
    else
        echo -e "${yellow}⚠ File .htaccess belum ada${nc}"
        echo "Membuat file .htaccess..."
        
        cat > "$LOCAL_DIR/.htaccess" << 'EOF'
# Enable rewrite engine
RewriteEngine On

# Force HTTPS (aktifkan setelah SSL aktif)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Remove trailing slash
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} (.+)/$
RewriteRule ^ %1 [L,R=301]

# Serve HTML files without extension
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.*)$ $1.html [L]

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json image/svg+xml
</IfModule>

# Deny access to sensitive files
<FilesMatch "^(\.htaccess|\.htpasswd|\.git|\.env|composer\.(json|lock)|package(-lock)?\.json)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Prevent directory listing
Options -Indexes

# Set default charset
AddDefaultCharset UTF-8
EOF
        
        echo -e "${green}✓ File .htaccess dibuat${nc}"
    fi
    echo ""
}

# Fungsi untuk manual instructions
show_manual_instructions() {
    echo -e "${blue}=== File Manager Instructions ===${nc}"
    echo ""
    echo "1. Buka browser dan akses cPanel:"
    echo "   https://aryafatthurahman1.ac.id:2083"
    echo ""
    echo "2. Login dengan username dan password hosting"
    echo ""
    echo "3. Cari 'File Manager' di dashboard"
    echo ""
    echo "4. Navigate ke: /home/aryafatthur1/public_html/"
    echo ""
    echo "5. Upload file berikut:"
    echo "   - index.html"
    echo "   - knowledge.html"
    echo "   - login.html"
    echo "   - dashboard.html"
    echo "   - .htaccess"
    echo "   - assets/ folder (css, js, img)"
    echo ""
    echo "6. Set permissions:"
    echo "   - Files: 644"
    echo "   - Folders: 755"
    echo ""
    echo -e "${green}✓ Upload selesai!${nc}"
    echo ""
    read -p "Tekan Enter untuk kembali ke menu..."
}

# Fungsi untuk FTP instructions
show_ftp_instructions() {
    echo -e "${blue}=== FTP Client Instructions ===${nc}"
    echo ""
    echo "1. Download FileZilla atau FTP client lain"
    echo ""
    echo "2. Konfigurasi FTP:"
    echo "   Host: aryafatthurahman1.ac.id atau 101.50.1.99"
    echo "   Username: aryafatthur1"
    echo "   Password: [password hosting Anda]"
    echo "   Port: 21 (FTP) atau 22 (SFTP)"
    echo ""
    echo "3. Connect ke server"
    echo ""
    echo "4. Navigate ke /public_html/ folder"
    echo ""
    echo "5. Upload semua file dari project"
    echo ""
    echo "6. Pastikan struktur folder benar"
    echo ""
    read -p "Tekan Enter untuk kembali ke menu..."
}

# Main loop
while true; do
    show_menu
    
    case $choice in
        1)
            show_manual_instructions
            ;;
        2)
            show_ftp_instructions
            ;;
        3)
            echo -e "${yellow}Pilih metode upload:${nc}"
            echo "a) SCP (secure copy)"
            echo "b) rsync (lebih cepat)"
            read -p "Pilih (a/b): " method
            
            case $method in
                a|A)
                    upload_scp
                    ;;
                b|B)
                    upload_rsync
                    ;;
                *)
                    echo -e "${red}Pilihan tidak valid${nc}"
                    ;;
            esac
            ;;
        4)
            test_connection
            ;;
        5)
            setup_htaccess
            ;;
        6)
            echo -e "${green}Terima kasih!${nc}"
            exit 0
            ;;
        *)
            echo -e "${red}Pilihan tidak valid${nc}"
            ;;
    esac
    
    echo ""
    read -p "Tekan Enter untuk melanjutkan..."
    clear
done
