# 07 — STATUS LAB (14 November 2026)

## Yang sudah jalan / tervalidasi

| Komponen | Status |
|---|---|
| Website statis (HTML/CSS/JS) di-preview | ✅ http://127.0.0.1:8080 (via Nginx Laragon) — sudah dihentikan, bisa dijalankan lagi |
| Terraform (3 konfigurasi) | ✅ `terraform validate` lulus (aws-real, localstack, vm-local) |
| YAML Kubernetes & Compose | ✅ parse valid |
| Skrip Bash | ✅ sintaks OK (Git Bash) |
| WSL Ubuntu: Nginx port 80 & website | ✅ Sempat berjalan: `http://192.168.100.3` → HTTP 200, dok di `/var/www/uts-lab` |
| WSL Ubuntu: Apache2 port 8081 | ✅ Sudah dikonfigurasi (default 000-default dinonaktifkan), perlu `systemctl start apache2` |
| Docker Desktop | ⚠️ Error 500 sebelum restart; sekarang sudah diminta start — tunggu 1–3 menit |

## Masalah pada mesin Anda

WSL2 Ubuntu **sering hang** (sudah hang dari awal, sempat jalan sebentar, lalu hang lagi
setelah `systemctl restart apache2`). Ini bukan masalah konfigurasi lab — ini kondisi sistem.
Tindakan yang biasanya memperbaiki:

1. **Restart Windows**.
2. Setelah nyala, buka **PowerShell** dan periksa:
   ```powershell
   wsl -l -v
   wsl -d Ubuntu -- true && echo OK
   ```
3. Jika WSL masih hang, jalankan `wsl --update` lalu `wsl --shutdown` dan coba lagi.

## Status setelah deploy (situs sudah terpasang di WSL)

File: `LAB/skrip/wsl-setup-site.sh` — menyalin website ke `/var/www/uts-lab`,
mengatur permission (`www-data` + 755/644), memasang server block Nginx untuk port 80.
`LAB/skrip/wsl-fix-apache-docker.sh` — memindahkan Apache2 ke port 8081
(agar tidak bentrok dengan Nginx), menonaktifkan `000-default`, dan menyalakan Docker.

Menjalankan ulang konfigurasi setelah reboot (di **PowerShell**):

```powershell
wsl -d Ubuntu -u root -- bash /mnt/c/laragon/www/UTS\ Ujian\ Tengah\ Semester\ EC2\ Amazon\ Linux/LAB/skrip/wsl-setup-site.sh
wsl -d Ubuntu -u root -- bash /mnt/c/laragon/www/UTS\ Ujian\ Tengah\ Semester\ EC2\ Amazon\ Linux/LAB/skrip/wsl-fix-apache-docker.sh
```

Lalu dari Windows & dari dalam WSL:

```powershell
curl http://192.168.100.3            # Nginx -> website (port 80)
curl http://192.168.100.3:8081       # Apache2 -> website (port 8081)
```

## Docker di WSL

`docker info` di dalam WSL sempat hang (daemon tidak berjalan stabil).
Setelah WSL restart, coba:

```bash
sudo service docker start
docker info --format '{{.ServerVersion}}'
```

Atau pakai **Docker Desktop (Windows)** dengan WSL2 integration di
*Settings → Resources → WSL Integration → Ubuntu* — daemon dikelola Windows, lebih stabil.

## Kubernetes (kind)

WSL: `kubectl` sudah terpasang; `kind` belum — setelah Docker jalan:

```bash
sudo curl -Lo /usr/local/bin/kind https://kind.sigs.k8s.io/dl/v0.27.0/kind-linux-amd64
sudo chmod +x /usr/local/bin/kind
kind create cluster --config "/mnt/c/laragon/www/UTS Ujian Tengah Semester EC2 Amazon Linux/LAB/05-KUBERNETES/kind-cluster.yaml"
kubectl apply -k "/mnt/c/laragon/www/UTS Ujian Tengah Semester EC2 Amazon Linux/LAB/05-KUBERNETES/manifests/"
curl http://192.168.100.3:8080
```

## Catatan penting

- Untuk **pengumpulan UTS**, Anda tetap butuh **EC2 asli** di AWS + Public IP —
  VM lokal hanyalah alat bantu latihan dan penjelasan video.
- Skrip dipertahankan di `LAB/skrip/` sebagai dokumentasi langkah yang dilakukan.
