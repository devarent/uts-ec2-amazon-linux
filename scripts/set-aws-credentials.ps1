# ------------------------------------------------------------------
# Simpan AWS Access Key untuk AWS CLI di Windows.
#
# Jalankan dari root proyek:
#   powershell -ExecutionPolicy Bypass -File scripts\set-aws-credentials.ps1
#
# Script ini TIDAK membuat key. Key harus dibuat di AWS Console:
#   IAM > Users > (user kamu) > Security credentials > Create access key
#   pilih "Command Line Interface (CLI)".
# ------------------------------------------------------------------

$ErrorActionPreference = "Stop"

function Fail($message) {
    Write-Host ""
    Write-Host "GAGAL: $message" -ForegroundColor Red
    exit 1
}

Write-Host "=== Set AWS credentials untuk CLI ===" -ForegroundColor Cyan
Write-Host "Ambil key di https://console.aws.amazon.com/iam"
Write-Host "Jangan tempel placeholder seperti AKIA................" -ForegroundColor Yellow
Write-Host ""

$accessKey = (Read-Host "Access Key ID (20 karakter, diawali AKIA)").Trim()

if ([string]::IsNullOrWhiteSpace($accessKey)) {
    Fail "Access Key ID kosong."
}
if ($accessKey.Length -ne 20) {
    Fail "Access Key ID harus 20 karakter, input kamu $($accessKey.Length) karakter."
}
if ($accessKey -match '\.') {
    Fail "Input masih mengandung titik placeholder, bukan key asli."
}
if ($accessKey -notmatch '^AKIA[0-9A-Z]{16}$') {
    Fail "Format tidak dikenali. Access Key IAM biasanya AKIA + 16 huruf/angka kapital."
}

Write-Host ""
$secretSecure = Read-Host "Secret Access Key (40 karakter)" -AsSecureString
$secretPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretSecure)
try {
    $secretKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPtr)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPtr)
}
$secretKey = $secretKey.Trim()

if ([string]::IsNullOrWhiteSpace($secretKey)) {
    Fail "Secret Access Key kosong."
}
if ($secretKey.Length -ne 40) {
    Fail "Secret Access Key harus 40 karakter, input kamu $($secretKey.Length) karakter."
}
if ($secretKey -match '\.') {
    Fail "Secret masih mengandung titik placeholder, bukan key asli."
}

Write-Host ""
Write-Host "Menyimpan ke profil default..." -ForegroundColor Cyan
aws configure set aws_access_key_id $accessKey
aws configure set aws_secret_access_key $secretKey
aws configure set region ap-southeast-1
aws configure set output json

Write-Host ""
Write-Host "Verifikasi identitas AWS..." -ForegroundColor Cyan
aws sts get-caller-identity
if ($LASTEXITCODE -ne 0) {
    Fail "AWS menolak key tersebut. Pastikan key aktif dan belum dihapus."
}

Write-Host ""
Write-Host "BERHASIL. Credentials valid." -ForegroundColor Green
