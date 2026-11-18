@echo off
REM Quick Deployment Script untuk cPanel Hosting
REM IP: 101.50.1.99
REM Domain: aryafatthurahman1.ac.id
REM Username: aryafatthur1

setlocal enabledelayedexpansion

echo ============================================================
echo           Quick Deployment - cPanel Hosting
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

REM Cek apakah file yang diperlukan ada
set "missing_files=0"
for %%f in (index.html knowledge.html login.html dashboard.html .htaccess) do (
    if not exist "%LOCAL_DIR%%%f" (
        echo [X] Missing file: %%f
        set "missing_files=1"
    )
)

if not exist "%LOCAL_DIR%assets" (
    echo [X] Missing folder: assets
    set "missing_files=1"
)

if "%missing_files%"=="1" (
    echo.
    echo [X] Beberapa file tidak ditemukan. Pastikan semua file ada.
    echo.
    pause
    exit /b 1
)

echo [OK] Semua file yang diperlukan ada
echo.

REM Upload files
echo Uploading files...
for %%f in (index.html knowledge.html login.html dashboard.html README.md DEPLOYMENT-GUIDE.md DEPLOY-CPANEL.md README-DEPLOYMENT.md DEPLOYMENT-CHECKLIST.md .htaccess) do (
    if exist "%LOCAL_DIR%%%f" (
        echo   Uploading %%f...
        scp "%LOCAL_DIR%%%f" %USER%@%HOST%:%REMOTE_DIR%/
        if !errorlevel! neq 0 (
            echo [X] Failed to upload %%f
        ) else (
            echo [OK] %%f uploaded
        )
    )
)

REM Upload assets folder
echo.
echo Uploading assets folder...
scp -r "%LOCAL_DIR%assets" %USER%@%HOST%:%REMOTE_DIR%/
if !errorlevel! neq 0 (
    echo [X] Failed to upload assets folder
) else (
    echo [OK] assets folder uploaded
)

echo.
echo ============================================================
echo           Deployment Complete!
echo ============================================================
echo.
echo Next steps:
echo 1. Test website: http://%HOST%
echo 2. Setup SSL certificate di cPanel
echo 3. Uncomment HTTPS redirect di .htaccess
echo.
echo Files uploaded:
echo   - index.html
echo   - knowledge.html
echo   - login.html
echo   - dashboard.html
echo   - .htaccess
echo   - assets/ folder
echo.
pause
