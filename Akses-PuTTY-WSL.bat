@echo off
setlocal
title Akses PuTTY ke WSL2 Ubuntu
echo ================================================
echo   Menyiapkan server SSH di WSL2 Ubuntu
echo   Setelah siap, PuTTY akan terbuka otomatis.
echo ================================================
echo.

echo [1/3] Menyalakan WSL2 Ubuntu...
wsl.exe -d Ubuntu -u root --exec true >nul 2>&1
wsl.exe -d Ubuntu -u root --exec systemctl start ssh >nul 2>&1
wsl.exe -d Ubuntu -u root --exec systemctl start nginx >nul 2>&1

echo [2/3] Menunggu port 2222 siap...
set /a tries=0
:wait
powershell -NoProfile -Command "$c=New-Object Net.Sockets.TcpClient; try{$c.Connect('127.0.0.1',2222);$c.Close();exit 0}catch{exit 1}" >nul 2>&1
if not errorlevel 1 goto ready
set /a tries+=1
if %tries% EQU 8 wsl.exe -d Ubuntu -u root --exec systemctl restart ssh >nul 2>&1
if %tries% GEQ 20 goto failed
timeout /t 2 /nobreak >nul
goto wait

:ready
echo [3/3] Membuka PuTTY (sesi UTS-WSL)...
start "" "C:\Program Files\PuTTY\putty.exe" -load "UTS-WSL"
exit /b 0

:failed
echo.
echo GAGAL: SSH server WSL belum siap setelah 40 detik.
echo Coba jalankan manual di PowerShell:
echo   wsl -d Ubuntu -u root -- systemctl restart ssh
echo   wsl -d Ubuntu -u root -- ss -tlnp ^| grep 2222
echo.
pause
exit /b 1
