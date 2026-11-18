$log = "C:\laragon\www\UTS Ujian Tengah Semester EC2 Amazon Linux\hosts-log.txt"
try {
    $entry = "101.50.1.99 aryafatthurahman1.ac.id"
    $hosts = "C:\Windows\System32\drivers\etc\hosts"
    $content = Get-Content $hosts -Raw -ErrorAction Stop
    if ($content -notmatch "aryafatthurahman1\.ac\.id") {
        Add-Content -Path $hosts -Value "`r`n$entry" -ErrorAction Stop
        "SUCCESS: added $entry" | Out-File $log
    } else {
        "SKIP: already exists" | Out-File $log
    }
} catch {
    "ERROR: $($_.Exception.Message)" | Out-File $log
}
