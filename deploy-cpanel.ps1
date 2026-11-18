# Deployment Script untuk cPanel Hosting (Windows PowerShell)
# IP: 101.50.1.99
# Domain: aryafatthurahman1.ac.id
# Username: aryafatthur1

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║          Deployment Script - cPanel Hosting                 ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Konfigurasi
$HOST = "aryafatthurahman1.ac.id"
$USER = "aryafatthur1"
$REMOTE_DIR = "/home/aryafatthur1/public_html"
$LOCAL_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Server Information:" -ForegroundColor Yellow
Write-Host "  Host: $HOST"
Write-Host "  IP: 101.50.1.99"
Write-Host "  User: $USER"
Write-Host "  Remote Dir: $REMOTE_DIR"
Write-Host "  Local Dir: $LOCAL_DIR"
Write-Host ""

function Show-Menu {
    Write-Host "Pilih metode deployment:" -ForegroundColor Blue
    Write-Host "1) Upload via File Manager (manual instructions)"
    Write-Host "2) Upload via FTP (FileZilla/WinSCP)"
    Write-Host "3) Upload via SCP/SSH (command line)"
    Write-Host "4) Test koneksi ke server"
    Write-Host "5) Setup .htaccess"
    Write-Host "6) Keluar"
    Write-Host ""
    $choice = Read-Host "Pilih opsi (1-6)"
    return $choice
}

function Show-ManualInstructions {
    Write-Host "=== File Manager Instructions ===" -ForegroundColor Blue
    Write-Host ""
    Write-Host "1. Buka browser dan akses cPanel:"
    Write-Host "   https://aryafatthurahman1.ac.id:2083"
    Write-Host ""
    Write-Host "2. Login dengan username dan password hosting"
    Write-Host ""
    Write-Host "3. Cari 'File Manager' di dashboard"
    Write-Host ""
    Write-Host "4. Navigate ke: /home/aryafatthur1/public_html/"
    Write-Host ""
    Write-Host "5. Upload file berikut:"
    Write-Host "   - index.html"
    Write-Host "   - knowledge.html"
    Write-Host "   - login.html"
    Write-Host "   - dashboard.html"
    Write-Host "   - .htaccess"
    Write-Host "   - assets/ folder (css, js, img)"
    Write-Host ""
    Write-Host "6. Set permissions:"
    Write-Host "   - Files: 644"
    Write-Host "   - Folders: 755"
    Write-Host ""
    Write-Host "✓ Upload selesai!" -ForegroundColor Green
    Write-Host ""
    Read-Host "Tekan Enter untuk kembali ke menu"
}

function Show-FTPInstructions {
    Write-Host "=== FTP Client Instructions ===" -ForegroundColor Blue
    Write-Host ""
    Write-Host "1. Download FileZilla atau FTP client lain"
    Write-Host ""
    Write-Host "2. Konfigurasi FTP:"
    Write-Host "   Host: aryafatthurahman1.ac.id atau 101.50.1.99"
    Write-Host "   Username: aryafatthur1"
    Write-Host "   Password: [password hosting Anda]"
    Write-Host "   Port: 21 (FTP) atau 22 (SFTP)"
    Write-Host ""
    Write-Host "3. Connect ke server"
    Write-Host ""
    Write-Host "4. Navigate ke /public_html/ folder"
    Write-Host ""
    Write-Host "5. Upload semua file dari project"
    Write-Host ""
    Write-Host "6. Pastikan struktur folder benar"
    Write-Host ""
    Read-Host "Tekan Enter untuk kembali ke menu"
}

function Upload-SCP {
    Write-Host "=== Upload via SCP ===" -ForegroundColor Blue
    Write-Host ""
    
    # File yang akan diupload
    $files = @(
        "index.html",
        "knowledge.html",
        "login.html",
        "dashboard.html",
        "README.md",
        "DEPLOYMENT-GUIDE.md",
        "DEPLOY-CPANEL.md",
        ".htaccess"
    )
    
    # Upload HTML files
    foreach ($file in $files) {
        $filePath = Join-Path $LOCAL_DIR $file
        if (Test-Path $filePath) {
            Write-Host "Uploading $file..." -ForegroundColor Yellow
            scp "$filePath" "${USER}@${HOST}:${REMOTE_DIR}/"
        }
    }
    
    # Upload assets folder
    Write-Host "Uploading assets folder..." -ForegroundColor Yellow
    scp -r "$LOCAL_DIR/assets" "${USER}@${HOST}:${REMOTE_DIR}/"
    
    Write-Host "✓ Upload selesai!" -ForegroundColor Green
    Write-Host ""
}

function Upload-Rsync {
    Write-Host "=== Upload via rsync ===" -ForegroundColor Blue
    Write-Host ""
    
    # Cek apakah rsync tersedia (biasanya tidak di Windows)
    $rsync = Get-Command rsync -ErrorAction SilentlyContinue
    if (-not $rsync) {
        Write-Host "✗ rsync tidak tersedia di Windows. Gunakan metode lain." -ForegroundColor Red
        return
    }
    
    Write-Host "Menggunakan rsync untuk upload (lebih cepat)..." -ForegroundColor Yellow
    
    # Upload files
    rsync -avz --progress `
        --exclude='node_modules' `
        --exclude='.git' `
        --exclude='*.log' `
        "$LOCAL_DIR/" "${USER}@${HOST}:${REMOTE_DIR}/"
    
    Write-Host "✓ Upload selesai!" -ForegroundColor Green
    Write-Host ""
}

function Test-Connection {
    Write-Host "=== Testing Koneksi ===" -ForegroundColor Blue
    Write-Host ""
    
    # Test ping
    Write-Host "Testing ping ke $HOST..." -ForegroundColor Yellow
    $ping = Test-Connection -ComputerName $HOST -Count 3 -ErrorAction SilentlyContinue
    if ($ping) {
        Write-Host "✓ Ping berhasil" -ForegroundColor Green
    } else {
        Write-Host "✗ Ping gagal" -ForegroundColor Red
    }
    
    # Test HTTP
    Write-Host "Testing HTTP access..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://$HOST" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ HTTP berhasil" -ForegroundColor Green
        }
    } catch {
        Write-Host "✗ HTTP gagal" -ForegroundColor Red
    }
    
    # Test HTTPS
    Write-Host "Testing HTTPS access..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "https://$HOST" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ HTTPS berhasil" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠ HTTPS belum aktif (SSL belum diinstall)" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

function Setup-HTAccess {
    Write-Host "=== Setup .htaccess ===" -ForegroundColor Blue
    Write-Host ""
    
    $htaccessPath = Join-Path $LOCAL_DIR ".htaccess"
    if (Test-Path $htaccessPath) {
        Write-Host "✓ File .htaccess sudah ada di project" -ForegroundColor Green
        Write-Host "File akan diupload bersama file lainnya."
    } else {
        Write-Host "⚠ File .htaccess belum ada" -ForegroundColor Yellow
        Write-Host "Membuat file .htaccess..."
        
        $htaccessContent = @"
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
RewriteRule ^(.*)$ `$1.html [L]

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
"@
        
        Set-Content -Path $htaccessPath -Value $htaccessContent -Encoding UTF8
        Write-Host "✓ File .htaccess dibuat" -ForegroundColor Green
    }
    Write-Host ""
}

# Main loop
while ($true) {
    $choice = Show-Menu
    
    switch ($choice) {
        "1" { Show-ManualInstructions }
        "2" { Show-FTPInstructions }
        "3" { 
            Write-Host "Pilih metode upload:" -ForegroundColor Yellow
            Write-Host "a) SCP (secure copy)"
            Write-Host "b) rsync (lebih cepat)"
            $method = Read-Host "Pilih (a/b)"
            
            switch ($method) {
                "a" { Upload-SCP }
                "b" { Upload-Rsync }
                default { Write-Host "Pilihan tidak valid" -ForegroundColor Red }
            }
        }
        "4" { Test-Connection }
        "5" { Setup-HTAccess }
        "6" { 
            Write-Host "Terima kasih!" -ForegroundColor Green
            exit 0
        }
        default { Write-Host "Pilihan tidak valid" -ForegroundColor Red }
    }
    
    Write-Host ""
    Read-Host "Tekan Enter untuk melanjutkan"
    Clear-Host
}
