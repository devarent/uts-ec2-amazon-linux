# Akses PuTTY ke WSL2 Ubuntu (Alternatif Tanpa AWS)

**Muhammad Arya Fatthurahman · NIM 2023230006 · TIFM**

Dokumen ini mencatat konfigurasi yang sudah dipasang di laptop ini sebagai pengganti sementara EC2:
WSL2 Ubuntu dijadikan server SSH + web server, lalu diakses dari Windows memakai PuTTY.

> Catatan penting: ini **bukan pengganti EC2 untuk penilaian UTS** yang mewajibkan Public IP AWS.
> Ini dipakai agar alur SSH → web server → website tetap bisa didemokan tanpa akun AWS.

---

## 1. Ringkasan yang sudah terpasang

| Komponen | Nilai |
|---|---|
| Distro WSL2 | Ubuntu 26.04 LTS |
| User Linux | `aryafatt` |
| SSH server | OpenSSH, port **2222** |
| Key PuTTY | `C:\Users\aryaf\Downloads\uts-wsl-key.ppk` |
| Sesi PuTTY | `UTS-WSL` (sudah tersimpan) |
| Web server | Nginx, port 80 |
| Website lokal | <http://192.168.100.3> dan <http://192.168.100.3/uts/> |
| Public URL sementara | <https://recycling-bureau-kitty-walnut.trycloudflare.com> |

Alamat `localhost:2222` diteruskan otomatis oleh WSL ke Windows, jadi PuTTY tidak perlu tahu IP internal WSL.

---

## 2. Cara membuka PuTTY

### Cara cepat
Double-click:

```
C:\Users\aryaf\Desktop\Akses-PuTTY-WSL.bat
```

Script akan menyalakan WSL, memastikan `ssh` dan `nginx` aktif, menunggu port 2222, lalu membuka sesi **UTS-WSL**.

### Cara manual
1. Buka **PuTTY**.
2. Pilih Saved Session **UTS-WSL** → **Load** → **Open**.
3. Jika muncul peringatan *host key is not cached*, klik **Accept** (sekali saja).

Isi sesi:

| Bagian | Nilai |
|---|---|
| Host Name | `127.0.0.1` |
| Port | `2222` |
| Connection type | SSH |
| Username | `aryafatt` |
| Private key | `C:\Users\aryaf\Downloads\uts-wsl-key.ppk` |

---

## 3. Perintah yang berguna setelah login

```bash
whoami                     # aryafatt
hostname
cd /var/www/html
ls -la
sudo systemctl status nginx
sudo systemctl restart nginx
curl -I http://192.168.100.3
```

Edit website:

```bash
sudo nano /var/www/html/index.html
sudo systemctl restart nginx
```

---

## 4. Website

Nginx menyajikan:

- `http://192.168.100.3/` → `/var/www/html/index.html`
- `http://192.168.100.3/uts/` → `/var/www/html/uts/`

Keduanya mengembalikan **HTTP 200** dan menampilkan portofolio Arya.

### Public URL (Cloudflare Quick Tunnel)

Saat ini tunnel sedang berjalan dan bisa diakses dari internet:

```
https://recycling-bureau-kitty-walnut.trycloudflare.com
```

URL ini **sementara** — berubah setiap cloudflared dijalankan ulang, dan hanya hidup selama laptop + WSL + cloudflared menyala.

Menjalankan ulang tunnel:

```powershell
& "$env:LOCALAPPDATA\Programs\cloudflared\cloudflared.exe" tunnel --url http://192.168.100.3:80 --no-autoupdate
```

URL baru akan muncul di output (baris `trycloudflare.com`).

---

## 5. Troubleshooting

| Gejala | Solusi |
|---|---|
| PuTTY: `Connection refused` | Jalankan `wsl -d Ubuntu -u root -- systemctl restart ssh` |
| PuTTY: `No supported authentication methods` | Pastikan key `uts-wsl-key.ppk` dipilih di sesi |
| PuTTY: host key berubah | Klik **Accept**; host key WSL bisa berubah setelah distro dibuat ulang |
| `localhost:2222` tidak terbuka | Cek `wsl -d Ubuntu -u root -- ss -tlnp \| grep 2222` |
| Website 502/404 | Cek `wsl -d Ubuntu -u root -- systemctl status nginx` |
| WSL tidak merespon | `wsl --shutdown`, lalu jalankan lagi `Akses-PuTTY-WSL.bat` |

---

## 6. Key pair `awskeypair` + akses lewat IP LAN

Dibuat 17 November 2026 untuk skenario “PuTTY → IP server → key RSA”.

| Item | Nilai |
|---|---|
| Private key OpenSSH/PEM | `C:\Users\aryaf\Downloads\awskeypair.pem` |
| Private key PuTTY | `C:\Users\aryaf\Downloads\awskeypair.ppk` |
| Public key | `C:\Users\aryaf\Downloads\awskeypair.pub` |
| Tipe | RSA 4096-bit |
| Fingerprint | `SHA256:GX8TqI+SVPN+9a94J25wPJQZSXkAV767uxrl55KpZIs` |
| Sesi PuTTY | `AWS-awskeypair` |
| Host / Port | `192.168.100.3` / `2224` |
| User | `aryafatt` |
| Key di sesi | `awskeypair.ppk` |
| Password | tidak dipakai (key-only di port LAN) |

### Cara membuka
Double-click shortcut Desktop:

```
PuTTY awskeypair (burung).lnk
```

atau `Buka-PuTTY-AWS.bat`. Script akan:
1. Menyalakan WSL2 dan `ssh`.
2. Mendeteksi IP WSL terbaru.
3. Menjalankan proxy `0.0.0.0:2224 → <IP-WSL>:2223`.
4. Membuka PuTTY sesi `AWS-awskeypair`.

Saat pertama connect, PuTTY menampilkan host key. Bandingkan fingerprint-nya:

```
SHA256:E0bQ8ksnpufcbKzx3vVDxlRyEITBBD/HjB8SwjfF+W8
```

lalu klik **Accept** (sekali saja).

### Gambar burung
- PNG: `assets/img/burung-putty.png`
- ICO: `assets/img/burung-putty.ico`
- Dipakai sebagai icon shortcut PuTTY di Desktop.

### Penting: 192.168.100.3 bukan IP publik
`192.168.100.3` adalah IP LAN laptop (Wi-Fi). IP publik internet saat ini
`180.247.61.16`, tetapi port 2224 **belum** diteruskan router, jadi belum bisa
diakses dari internet. Agar bisa dari luar:

1. Tambah **Port Forwarding** di router: TCP `2224` → `192.168.100.3:2224`.
2. Izinkan `node.exe` / port 2224 di Windows Firewall (butuh admin).
3. Catat bahwa IP publik bisa berubah (PPPoE dinamis).

Alternatif yang lebih aman untuk publik: VM cloud gratis (Oracle/GCP) atau
TCP tunnel (ngrok/pinggy) — jangan buka password `123` ke internet.

### Troubleshooting
| Gejala | Solusi |
|---|---|
| `Connection refused` di 2224 | Jalankan ulang shortcut burung; script mendeteksi IP WSL baru |
| Host key berubah | Pastikan masih WSL yang sama; Accept jika yakin |
| Login ditolak | Pastikan key `awskeypair.ppk`, user `aryafatt` |
| Website 3001/3002 mati | Nyalakan kembali app Node/Docker terkait |

---

## 7. Kalau nanti butuh Public IP asli (bukan tunnel)

Alternatif cloud gratis yang memberi VM + Public IP:

- **Oracle Cloud Always Free** — VM.Standard.A1.Flex / E2.1.Micro + public IP.
- **Google Cloud Free Tier** — e2-micro di region tertentu + external IP.
- **Azure for Students** — kredit gratis + public IP.
- **IDCloudHost / Biznet Gio / DigitalOcean** — VPS murah dengan IP publik.

Alur PuTTY-nya sama: ganti Host Name ke Public IP, Port 22, dan key `.ppk` milik server baru.
