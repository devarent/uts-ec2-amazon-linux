$log = "C:\laragon\www\UTS Ujian Tengah Semester EC2 Amazon Linux\fw-log.txt"
try {
    $ruleName = "Portfolio-Dev-3000"
    $existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Any | Out-Null
        "SUCCESS: firewall rule added for port 3000" | Out-File $log
    } else {
        "SKIP: rule already exists" | Out-File $log
    }
} catch {
    "ERROR: $($_.Exception.Message)" | Out-File $log
}
