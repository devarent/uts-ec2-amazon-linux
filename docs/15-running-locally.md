# 15 — Menjalankan Secara Lokal (Lewat CMD / PowerShell + WSL)

Stack yang berjalan:

```text
Windows/WSL2 (node)
   |
   v
Next.js dev server  :3000   (npm run dev)
   |
   v
PostgreSQL 18 native Windows  :5433   (embedded-postgres)
```

## Pilihan A — DB lokal + dev server (TANGAN DINGIN)

### 1. Start PostgreSQL native Windows (background, sekali jalan)

```powershell
cd $env:LocalAppData\Temp\opencode\embedded-pg
node run-pg.mjs
```

Log `run-pg.log` berisi konfirmasi: `POSTGRES WINDOWS READY DI 127.0.0.1:5433`.
Kredensial: `user: ec2lab` · `password: ec2labpass` · database: `ec2lab`.
Skema di-apply otomatis (7 tabel: guestbook, app_users, app_sessions, ...).
Data persisten tersimpan di `Temp\opencode\embedded-pg\data\db` (`persistent: true`).

### 2. Start aplikasi (jendela baru)

```powershell
$env:DATABASE_URL="postgresql://ec2lab:ec2labpass@127.0.0.1:5433/ec2lab"
$env:DATABASE_SSL="false"
cd "C:\laragon\www\AWS EC2 Web Hosting Part 1\app"
npm run dev
```

### 3. Buka di browser

```text
http://192.168.100.3:3000
http://192.168.100.3:3000/guide
http://192.168.100.3:3000/dashboard
http://192.168.100.3:3000/api/health   <-- db.status: up
http://192.168.100.3:3000/api/guestbook
```

## Pilihan B — WSL Ubuntu + cmd (jika WSL stabil)

1. Tutup aplikasi berat (Chrome, Spotify, Roblox) → RAM bebas minimal 4–5 GB.
2. `wsl --shutdown` lalu `wsl -d Ubuntu -- true` — harus selesai < 30 detik.
3. Masuk & jalankan app (karena WSL2 saling men-forward `localhost` saat stabil):

```bash
wsl -d Ubuntu
node --version            # pastikan node terpasang
cd /mnt/c/laragon/www/AWS\ EC2\ Web\ Hosting\ Part\ 1/app
DATABASE_URL=postgresql://ec2lab:ec2labpass@<WSL-IP>:5433/ec2lab npm run dev
```

Catatan: di mesin ini WSL sering mati karena RAM habis (Wsl/Service/WSAETIMEDOUT).
Jika muncul, mulai ulang dengan `wsl --shutdown`, tutup aplikasi besar, dan uji lagi.

## Pilihan C — Docker (jika Docker Desktop sehat)

```powershell
cd "C:\laragon\www\AWS EC2 Web Hosting Part 1"
docker compose up -d db app
curl http://192.168.100.3:3000/api/health   # db.status: up
curl http://192.168.100.3:3000/api/guestbook
```

## Verifikasi CRUD guestbook

```powershell
$body = '{"name":"MUHAMMAD ARYA FATTHURAHMAN","message":"Test"}'
Invoke-RestMethod http://192.168.100.3:3000/api/guestbook -Method POST -ContentType "application/json" -Body $body
Invoke-RestMethod http://192.168.100.3:3000/api/guestbook
```

## Menghentikan

```powershell
# hentikan next dev (Ctrl+C di jendelanya)
# hentikan embedded postgres: tutup proses node run-pg.mjs
Get-Process -Name node | Format-Table Id,Name,WorkingSet
```
