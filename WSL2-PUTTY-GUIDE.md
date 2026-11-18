# Panduan WSL2 Ubuntu + PuTTY → AWS EC2

**Tugas UTS Cloud Computing**
Nama: **Muhammad Arya Fatthurahman** · NIM: **2023230006** · Kelas: **TIFM**
Program Studi S1 Teknologi Informasi — Universitas Darma Persada (UNSADA)

---

## Ringkasan

Panduan ini menjelaskan cara menyiapkan **dua jalur akses** ke instance AWS EC2 dari laptop Windows:

| Jalur | Dipakai untuk | Port |
|---|---|---|
| **WSL2 Ubuntu** | Semua perintah Linux, `scp`, Terraform, Docker, kubectl | 22 (SSH) |
| **PuTTY** | Terminal SSH alternatif saat presentasi / demo ulang | 22 (SSH) |

Setelah terhubung, instance dipasangi **Apache2** dan website `index.html + assets/` dideploy ke `/var/www/html`, lalu dibuka lewat **Public IP** — **bukan** `localhost`.

> ⚠️ **Aturan keamanan:** file `.pem` / `.ppk` bersifat rahasia. Jangan pernah direkam di video, di-commit ke GitHub, atau dikirim lewat chat. Password Linux dan Access Key juga tidak boleh muncul di video.

---

## 1. Install WSL2 + Ubuntu (Windows 10/11)

Buka **PowerShell sebagai Administrator**, lalu:

```powershell
wsl --install -d Ubuntu
wsl --set-default-version 2
```

Reboot bila diminta. Setelah restart, Ubuntu akan terbuka dan meminta:

- **Username** Linux (contoh: `arya`)
- **Password** Linux (tidak terlihat saat diketik — ini normal, bukan password AWS)

Verifikasi dari PowerShell:

```powershell
wsl -l -v
```

Harus muncul `Ubuntu` dengan `VERSION 2` dan `STATE Running`.

> Jika WSL belum aktif: `dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart`
> lalu `dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart`, reboot, dan ulangi `wsl --install`.

---

## 2. Siapkan tools di dalam Ubuntu

Semua perintah berikut dijalankan di terminal **Ubuntu (WSL2)**:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip openssh-client apache2 jq

# verifikasi
lsb_release -ds          # Ubuntu 24.04 LTS / 26.04 LTS
git --version
ssh -V
apache2 -v
```

Opsional (untuk lab lanjutan):

```bash
# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker

# Terraform
sudo apt install -y gnupg software-properties-common
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install -y terraform

# kubectl + helm
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -m 0755 kubectl /usr/local/bin/kubectl
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

Atau jalankan skrip yang sudah disediakan:

```bash
bash LAB/02-WSL2/install-tools.sh
```

---

## 3. Akses file Windows dari WSL2

Folder Windows bisa diakses dari Ubuntu lewat `/mnt/c/...`:

```bash
cd "/mnt/c/laragon/www/UTS Ujian Tengah Semester EC2 Amazon Linux"
ls -la
```

Salin key pair ke direktori kerja WSL2 dan kunci permission-nya:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
cp /mnt/c/Users/<USER_WINDOWS>/Downloads/uts-cloud-key.pem ~/.ssh/
chmod 400 ~/.ssh/uts-cloud-key.pem
```

> `chmod 400` wajib. Tanpa ini SSH akan menolak dengan pesan *"permissions are too open"*.

---

## 4. Convert `.pem` → `.ppk` untuk PuTTY

AWS memberi file **`.pem`** (format OpenSSH). PuTTY memakai **`.ppk`**.

1. Unduh PuTTY (installer 64-bit) dari <https://www.putty.org/> — sekaligus terpasang **PuTTYgen**.
2. Buka **PuTTYgen**.
3. Klik **Load** → pilih file `.pem`.
   - Jika file tidak terlihat, ubah filter di kanan bawah menjadi **All Files (\*.\*)**.
4. Setelah muncul *"Successfully imported foreign key"*, klik **OK**.
5. Klik **Save private key** → jawab **Yes** pada peringatan passphrase → simpan sebagai
   `uts-cloud-key.ppk` di folder pribadi.
6. Tutup PuTTYgen.

> Jangan klik **Generate** — itu membuat key baru yang tidak dikenali AWS.
> Jangan bagikan `.ppk`: siapa pun yang memilikinya bisa masuk ke server Anda.

---

## 5. Konfigurasi sesi PuTTY

1. Buka **PuTTY**.
2. Isi **Host Name (or IP address)**:
   - Ubuntu  → `ubuntu@<PUBLIC-IP>`
   - Amazon Linux → `ec2-user@<PUBLIC-IP>`
3. **Port**: `22` · **Connection type**: `SSH`
4. Sidebar kiri: **Connection → SSH → Auth → Credentials**
   - *Private key file for authentication* → **Browse** → pilih `uts-cloud-key.ppk`
5. Kembali ke **Session**:
   - **Saved Sessions**: `UTS-EC2`
   - Klik **Save**
6. Klik **Open**.
7. Prompt pertama: *"The server's host key is not cached…"* → klik **Accept** (hanya sekali per instance).
8. Login berhasil jika muncul prompt seperti `ubuntu@ip-172-31-x-x:~$`.

### Alternatif: langsung dari WSL2

```bash
ssh -i ~/.ssh/uts-cloud-key.pem ubuntu@<PUBLIC-IP>
```

Tambahkan ke `~/.ssh/config` agar tidak perlu mengetik panjang:

```sshconfig
Host uts-ec2
    HostName <PUBLIC-IP>
    User ubuntu
    IdentityFile ~/.ssh/uts-cloud-key.pem
    ServerAliveInterval 60
```

Setelah itu cukup: `ssh uts-ec2`

---

## 6. Kalau koneksi SSH gagal

| Gejala | Penyebab | Solusi |
|---|---|---|
| `Connection timed out` | Security Group belum membuka port 22 | EC2 → Security Group → Inbound → SSH 22 dari **My IP** |
| `Permission denied (publickey)` | User salah, atau key bukan pasangan instance | Ubuntu → `ubuntu@`; Amazon Linux → `ec2-user@`. Pastikan pakai `.pem` yang dibuat saat instance diluncurkan |
| `WARNING: UNPROTECTED PRIVATE KEY FILE` | Permission terlalu terbuka | `chmod 400 ~/.ssh/*.pem` |
| `Network is unreachable` / IP berubah | Public IP dinamis berubah setelah stop/start | Pakai **Elastic IP**, atau ambil ulang IP dari konsol EC2 |
| PuTTY: `No supported authentication methods` | Belum memilih `.ppk` | Ulangi langkah 5.4, lalu **Save** sesi lagi |

---

## 7. Pasang web server di EC2

Dari sesi SSH (PuTTY atau WSL2):

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y apache2
sudo systemctl enable --now apache2
sudo systemctl status apache2 --no-pager

# buka firewall OS bila aktif
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
```

Untuk Amazon Linux 2023:

```bash
sudo dnf install -y httpd
sudo systemctl enable --now httpd
sudo systemctl status httpd --no-pager
```

Cek dari dalam server:

```bash
curl -I http://192.168.100.3
# HTTP/1.1 200 OK
```

> `localhost` di dalam server hanya untuk uji internal.
> **Pengumpulan tugas tetap memakai `http://<PUBLIC-IP>`**.

---

## 8. Deploy website ke `/var/www/html`

### 8.1 Kirim file dari Windows/WSL2 ke EC2

Dari WSL2 (di folder proyek):

```bash
cd "/mnt/c/laragon/www/UTS Ujian Tengah Semester EC2 Amazon Linux"

scp -i ~/.ssh/uts-cloud-key.pem -r index.html assets ubuntu@<PUBLIC-IP>:~/
```

### 8.2 Pindahkan ke document root

Dari sesi SSH di EC2:

```bash
sudo rm -f /var/www/html/index.html
sudo cp -r ~/index.html ~/assets /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

ls -R /var/www/html
```

Struktur akhir yang benar:

```
/var/www/html/
├── index.html
└── assets/
    ├── css/style.css
    ├── img/foto-profil.jpg
    ├── img/favicon.svg
    └── js/main.js
```

### 8.3 Verifikasi dari laptop

```bash
curl -I http://<PUBLIC-IP>
curl -o /dev/null -s -w "%{http_code}\n" http://<PUBLIC-IP>/assets/css/style.css
```

Keduanya harus `200`. Buka `http://<PUBLIC-IP>` di browser: halaman harus tampil
**dengan CSS dan foto profil**.

| Hasil | Arti |
|---|---|
| Halaman tampil penuh | Deployment benar ✅ |
| Teks saja, tanpa warna | `assets/css/style.css` belum ada → ulangi 8.1–8.2 |
| Foto rusak (ikon patah) | `assets/img/foto-profil.jpg` belum ter-copy |
| `403 Forbidden` | Permission salah → ulangi `chown`/`chmod` |
| Halaman default web server | `index.html` masih di lokasi lama, belum dipindah ke `/var/www/html` |

---

## 9. Lanjutan lab (Docker → Terraform → Kubernetes)

```bash
# 9.1 Docker: bungkus website
cd ~/uts-static-site
docker build -t web-uts:v1 .
docker run -d --name web-uts -p 8080:80 web-uts:v1

# 9.2 Terraform: buat ulang infrastruktur dari kode
cd ~/aws-deploy/terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan -out tfplan
terraform apply tfplan
terraform output public_ip

# 9.3 Kubernetes lokal (kind) + Helm
kind create cluster --name uts
helm upgrade --install web ./helm/nextjs-app
kubectl get pods,svc,ingress
kubectl port-forward svc/web 8081:80
```

Setelah penilaian selesai:

```bash
terraform destroy     # hapus EC2, Security Group, Elastic IP
kind delete cluster --name uts
```

---

## 10. Checklist sebelum rekam video

- [ ] `wsl -l -v` menunjukkan Ubuntu **VERSION 2** dan **Running**
- [ ] PuTTY bisa login ke `ubuntu@<PUBLIC-IP>` memakai `.ppk`
- [ ] `sudo systemctl status apache2` → **active (running)**
- [ ] `http://<PUBLIC-IP>` terbuka di browser dengan CSS + foto
- [ ] Nama **Muhammad Arya Fatthurahman** dan **NIM 2023230006** terlihat di halaman
- [ ] Security Group: SSH 22 (My IP) + HTTP 80 (0.0.0.0/0)
- [ ] Tidak ada `.pem`, `.ppk`, password, atau Access Key yang terlihat di layar
- [ ] Setelah rekaman: instance di-**stop**, lalu `terraform destroy` jika tugas sudah dinilai

---

## 11. Perintah referensi cepat

```bash
# SSH
ssh -i ~/.ssh/uts-cloud-key.pem ubuntu@<PUBLIC-IP>

# Copy file ke server
scp -i ~/.ssh/uts-cloud-key.pem -r index.html assets ubuntu@<PUBLIC-IP>:~/

# Web server
sudo systemctl restart apache2
sudo tail -f /var/log/apache2/error.log

# Docker
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker compose logs --tail=50

# Terraform
terraform init && terraform plan && terraform apply
terraform destroy

# Kubernetes
kubectl get all
kubectl describe pod <nama-pod>

# Info instance (dari dalam EC2)
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

---

**Referensi**

- WSL2 — <https://learn.microsoft.com/windows/wsl/install>
- PuTTY & PuTTYgen — <https://www.putty.org/>
- AWS EC2 key pairs — <https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html>
- Apache2 on Ubuntu — <https://ubuntu.com/server/docs/web-servers-apache>
- Terraform AWS provider — <https://registry.terraform.io/providers/hashicorp/aws/latest/docs>
