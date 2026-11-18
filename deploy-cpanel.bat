@echo off
REM Deployment Script untuk cPanel Hosting (Windows Batch)
REM IP: 101.50.1.99
REM Domain: aryafatthurahman1.ac.id
REM Username: aryafatthur1

setlocal enabledelayedexpansion

echo ============================================================
echo           Deployment Script - cPanel Hosting
echo ============================================================
echo.

REM Konfigurasi
set "HOST=aryafatthurahman1.ac.id"
set "USER=aryafatthur1"
set "REMOTE_DIR=/home/aryafatthur1/public_html"
set "LOCAL_DIR=%~dp0"

echo Server Information:
echo   Host: %HOST%
echo   IP: 101.50.1.99
echo   User: %USER%
echo   Remote Dir: %REMOTE_DIR%
echo   Local Dir: %LOCAL_DIR%
echo.

:menu
cls
echo ============================================================
echo           Deployment Script - cPanel Hosting
echo ============================================================
echo.
echo Pilih metode deployment:
echo 1) Upload via File Manager (manual instructions)
echo 2) Upload via FTP (FileZilla/WinSCP)
echo 3) Upload via SCP/SSH (command line)
echo 4) Test koneksi ke server
echo 5) Setup .htaccess
echo 6) Keluar
echo.
set /p choice="Pilih opsi (1-6): "

if "%choice%"=="1" goto manual
goto "if%choice%"=="2" ftp
goto "if%choice%"=="3" scp
goto "if%choice%"=="4" test
goto "if%choice%"=="5" htaccess
goto "if%choice%"=="6" exit
goto invalid

:manual
echo.
echo === File Manager Instructions ===
echo.
echo 1. Buka browser dan akses cPanel:
echo    https://aryafatthurahman1.ac.id:2083
echo.
echo 2. Login dengan username dan password hosting
echo.
echo 3. Cari 'File Manager' di dashboard
echo.
echo 4. Navigate ke: /home/aryafatthur1/public_html/
echo.
echo 5. Upload file berikut:
echo    - index.html
echo    - knowledge.html
echo    - login.html
echo    - dashboard.html
echo    - .htaccess
echo    - assets/ folder (css, js, img)
echo.
echo 6. Set permissions:
echo    - Files: 644
echo    - Folders: 755
echo.
echo [OK] Upload selesai!
echo.
pause
goto menu

:ftp
echo.
echo === FTP Client Instructions ===
echo.
echo 1. Download FileZilla atau FTP client lain
echo.
echo 2. Konfigurasi FTP:
echo    Host: aryafatthurahman1.ac.id atau 101.50.1.99
echo    Username: aryafatthur1
echo    Password: [password hosting Anda]
echo    Port: 21 (FTP) atau 22 (SFTP)
echo.
echo 3. Connect ke server
echo.
echo 4. Navigate ke /public_html/ folder
echo.
echo 5. Upload semua file dari project
echo.
echo 6. Pastikan struktur folder benar
echo.
pause
goto menu

:scp
echo.
echo === Upload via SCP ===
echo.
echo Menyiapkan file untuk upload...
echo.

REM Upload HTML files
for %%f in (index.html knowledge.html login.html dashboard.html README.md DEPLOYMENT-GUIDE.md DEPLOY-CPANEL.md .htaccess) do (
    if exist "%LOCAL_DIR%%%f" (
        echo Uploading %%f...
        scp "%LOCAL_DIR%%%f" %USER%@%HOST%:%REMOTE_DIR%/
    )
)

REM Upload assets folder
echo Uploading assets folder...
scp -r "%LOCAL_DIR%assets" %USER%@%HOST%:%REMOTE_DIR%/

echo.
echo [OK] Upload selesai!
echo.
pause
goto menu

:test
echo.
echo === Testing Koneksi ===
echo.

echo Testing ping ke %HOST%...
ping -n 3 %HOST%
if %errorlevel%==0 (
    echo [OK] Ping berhasil
) else (
    echo [X] Ping gagal
)

echo.
echo Testing HTTP access...
curl -I http://%HOST%
if %errorlevel%==0 (
    echo [OK] HTTP berhasil
) else (
    echo [X] HTTP gagal
)

echo.
echo Testing HTTPS access...
curl -I https://%HOST%
if %errorlevel%==0 (
    echo [OK] HTTPS berhasil
) else (
    echo [!] HTTPS belum aktif (SSL belum diinstall)
)

echo.
pause
goto menu

:htaccess
echo.
echo === Setup .htaccess ===
echo.

if exist "%LOCAL_DIR%.htaccess" (
    echo [OK] File .htaccess sudah ada di project
    echo File akan diupload bersama file lainnya.
) else (
    echo [!] File .htaccess belum ada
    echo Membuat file .htaccess...
    
    (
        echo # Enable rewrite engine
        echo RewriteEngine On
        echo.
        echo # Force HTTPS ^(aktifkan setelah SSL aktif^)
        echo # RewriteCond %%{HTTPS} off
        echo # RewriteRule ^(.*)$ https://%%{HTTP_HOST}%%{REQUEST_URI} [L,R=301]
        echo.
        echo # Remove trailing slash
        echo RewriteCond %%{REQUEST_FILENAME} !-d
        echo RewriteCond %%{REQUEST_URI} ^(.+)/$
        echo RewriteRule ^ %%1 [L,R=301]
        echo.
        echo # Serve HTML files without extension
        echo RewriteCond %%{REQUEST_FILENAME} !-f
        echo RewriteCond %%{REQUEST_FILENAME} !-d
        echo RewriteCond %%{REQUEST_FILENAME}.html -f
        echo RewriteRule ^(.*)$ $1.html [L]
        echo.
        echo # Security headers
        echo ^<IfModule mod_headers.c^>
        echo     Header set X-Content-Type-Options "nosniff"
        echo     Header set X-Frame-Options "SAMEORIGIN"
        echo     Header set X-XSS-Protection "1; mode=block"
        echo     Header set Referrer-Policy "strict-origin-when-cross-origin"
        echo ^</IfModule^>
        echo.
        echo # Cache static assets
        echo ^<IfModule mod_expires.c^>
        echo     ExpiresActive On
        echo     ExpiresByType text/css "access plus 1 month"
        echo     ExpiresByType application/javascript "access plus 1 month"
        echo     ExpiresByType image/svg+xml "access plus 1 month"
        echo     ExpiresByType image/png "access plus 1 month"
        echo     ExpiresByType image/jpeg "access plus 1 month"
        echo ^</IfModule^>
        echo.
        echo # Gzip compression
        echo ^<IfModule mod_deflate.c^>
        echo     AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json image/svg+xml
        echo ^</IfModule^>
        echo.
        echo # Deny access to sensitive files
        echo ^<FilesMatch "^(\.htaccess|\.htpasswd|\.git|\.env|composer\.(json|lock)|package(-lock)?\.json)$"^>
        echo     Order allow,deny
        echo     Deny from all
        echo ^</FilesMatch^>
        echo.
        echo # Prevent directory listing
        echo Options -Indexes
        echo.
        echo # Set default charset
        echo AddDefaultCharset UTF-8
    ) > "%LOCAL_DIR%.htaccess"
    
    echo [OK] File .htaccess dibuat
)

echo.
pause
goto menu

:invalid
echo.
echo [X] Pilihan tidak valid
echo.
pause
goto menu

:exit
echo.
echo Terima kasih!
echo.
exit /b 0
