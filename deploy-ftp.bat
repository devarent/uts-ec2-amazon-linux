@echo off
REM FTP Deployment ke cPanel Hosting (Pure-FTPd, port 21)
REM IP: 101.50.1.99
REM User: aryafatthur1
REM Remote Dir: /home/aryafatthur1/public_html
REM Catatan: curl akan meminta password FTP secara interaktif (tidak tampil di layar)

setlocal enabledelayedexpansion

echo ============================================================
echo        FTP Deployment - cPanel Hosting (101.50.1.99)
echo ============================================================
echo.

set "FTP_HOST=101.50.1.99"
set "FTP_USER=aryafatthur1"
set "FTP_BASE=ftp://%FTP_HOST%/home/aryafatthur1/public_html/"
set "LOCAL_DIR=%~dp0"

echo FTP Server: %FTP_HOST%
echo FTP User:   %FTP_USER%
echo Remote:     /home/aryafatthur1/public_html/
echo Local:      %LOCAL_DIR%
echo.

REM Cek file wajib
set "missing=0"
for %%f in (index.html knowledge.html login.html dashboard.html .htaccess) do (
    if not exist "%LOCAL_DIR%%%f" (
        echo [X] Missing: %%f
        set "missing=1"
    )
)
if not exist "%LOCAL_DIR%assets" (
    echo [X] Missing folder: assets
    set "missing=1"
)
if "%missing%"=="1" (
    echo.
    echo [X] File tidak lengkap. Batalkan.
    pause
    exit /b 1
)

echo [OK] Semua file lengkap
echo.
echo Ketik password FTP/cPanel saat diminta (tidak akan tampil).
echo.

REM Test koneksi + upload file utama
for %%f in (index.html knowledge.html login.html dashboard.html .htaccess README.md) do (
    if exist "%LOCAL_DIR%%%f" (
        echo Uploading %%f ...
        curl -sS --ftp-create-dirs -u "%FTP_USER%" -T "%LOCAL_DIR%%%f" "%FTP_BASE%%%f"
        if !errorlevel! neq 0 (
            echo [X] Gagal upload %%f - periksa password/koneksi
            pause
            exit /b 1
        ) else (
            echo [OK] %%f
        )
    )
)

REM Upload folder assets rekursif (curl tidak support -r, pakai --ftp-create-dirs per file)
echo.
echo Uploading assets ...
for /r "%LOCAL_DIR%assets" %%f in (*) do (
    set "REL=%%f"
    set "REL=!REL:%LOCAL_DIR%=!"
    set "REL=!REL:\=/!"
    curl -sS --ftp-create-dirs -u "%FTP_USER%" -T "%%f" "%FTP_BASE%!REL!"
    if !errorlevel! neq 0 (
        echo [X] Gagal upload !REL!
    ) else (
        echo [OK] !REL!
    )
)

echo.
echo ============================================================
echo           Deployment Selesai!
echo ============================================================
echo.
echo Test website: http://101.50.1.99/
echo             http://101.50.1.99/knowledge.html
echo.
echo Catatan:
- DNS domain belum resolve. Setelah nameserver/A record diarahkan
echo   ke 101.50.1.99, akses via http://aryafatthurahman1.ac.id
echo - Aktifkan SSL di cPanel untuk HTTPS.
pause
