# Watchdog Amazon Linux 2023 (WSL2) - UTS EC2
# Anti-hang: setiap panggilan wsl.exe diberi batas waktu; gagal -> coba lagi nanti (tidak menumpuk proses)
$ErrorActionPreference = 'SilentlyContinue'

function Test-Port($port) {
    $c = New-Object Net.Sockets.TcpClient
    try { $c.Connect('127.0.0.1', $port); $c.Close(); return $true } catch { try { $c.Close() } catch {}; return $false }
}

function Invoke-WslTimed([string[]]$WslArgs, [int]$TimeoutSec = 20) {
    $p = Start-Process -FilePath 'wsl.exe' -ArgumentList $WslArgs -NoNewWindow -PassThru
    if (-not $p.WaitForExit($TimeoutSec * 1000)) { try { $p.Kill() } catch {}; return $false }
    return $true
}

while ($true) {
    if (-not (Test-Port 2226)) {
        # Nyalakan distro (timeout 20s, kalau nyangkut berhenti)
        [void](Invoke-WslTimed @('-d', 'AmazonLinux2023', '--exec', 'true') 20)
        Start-Sleep -Seconds 3
        # Pastikan sshd aktif
        [void](Invoke-WslTimed @('-d', 'AmazonLinux2023', '-u', 'root', '--', 'systemctl', 'start', 'sshd') 20)
        Start-Sleep -Seconds 2
        # Anchor: tahan VM agar tidak dimatikan setelah stub exit
        Start-Process -FilePath 'wsl.exe' -ArgumentList '-d AmazonLinux2023 -- bash -c "exec sleep infinity"' -WindowStyle Hidden
        Start-Sleep -Seconds 10
    }
    Start-Sleep -Seconds 30
}
