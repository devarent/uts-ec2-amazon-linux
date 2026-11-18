# Panduan Deployment UTS Cloud Computing

**Muhammad Arya Fatthurahman** &middot; NIM 2023230006 &middot; Kelas TIFM &middot; S1 Teknologi Informasi UNSADA

---

## Ringkasan

Project ini adalah portofolio dan knowledge base Cloud & DevOps yang dideploy ke AWS EC2 dengan akses publik. Portal terdiri dari:

- **index.html** - Halaman portofolio utama
- **knowledge.html** - Knowledge base lengkap (roadmap, AWS, Docker, K8s, Terraform, CI/CD)
- **login.html** - Halaman login (akun demo untuk presentasi)
- **dashboard.html** - Workspace dengan checklist EC2, database, pipeline, guestbook
- **assets/** - CSS, JS, dan gambar

Semua halaman berjalan sebagai **static site** - tidak butuh Node.js, database, atau container di production.

> Catatan: panduan di bawah menjelaskan jalur portal statis UTS. Untuk website full-stack **Next.js + Tailwind CSS + PostgreSQL** di Docker, gunakan aplikasi `app/` dan langkah Part 2–5 di [README.md](README.md). Terraform jalur tersebut menyiapkan Amazon Linux 2023, Elastic IP, dan akses SSH/PuTTY terbatas.

---

## Tiga Jalur Deployment

### 1. Jalur Statis (Dipakai untuk UTS)

Ini jalur utama dan paling sederhana. Cukup copy file ke docroot web server.

**Kelebihan:**
- Tidak butuh Node.js atau database
- Paling cepat dan aman untuk penilaian
- Biaya minimal (hanya EC2 t3.micro)

**Langkah:**
1. Launch EC2 dengan Terraform atau Console
2. SSH ke instance
3. Copy file statis ke `/var/www/uts/`
4. Reload Nginx
5. Akses dari IP publik

### 2. Jalur Dinamis (Lokal)

Untuk lab Next.js + PostgreSQL di folder `app/`.

**Kelebihan:**
- API auth, guestbook, health check
- Demonstrasi CRUD

**Langkah:**
```bash
cd app
npm ci
npm run build
npm run start
# Akses http://192.168.100.3:3000
```

### 3. Jalur Container (Opsional)

Docker Compose atau Kubernetes untuk skala produksi.

**Langkah:**
```bash
docker compose up -d
# atau
kubectl apply -f k8s/
```

---

## Langkah Deployment EC2 (Jalur Statis)

### Prasyarat

- Akun AWS dengan region `ap-southeast-1` (Singapura) atau `ap-southeast-3` (Jakarta)
- AWS CLI terinstall dan terkonfigurasi: `aws configure`
- Terraform terinstall: `terraform --version`
- Key pair `.pem` atau gunakan Terraform untuk generate otomatis

### Langkah 1: Deploy dengan Terraform

```bash
cd UTS-EC2-WebHosting/aws-deploy/terraform

# Set variabel (sesuaikan IP admin Anda)
export TF_VAR_ssh_cidr="180.247.56.204/32"  # Ganti dengan IP Anda
export TF_VAR_key_name="uts-ec2-aryaf"
export TF_VAR_region="ap-southeast-1"

# Initialize dan apply
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# Catat output:
# - public_ip: untuk akses site
# - instance_id: untuk cleanup
# - eip_allocation_id: untuk cleanup
```

### Langkah 2: Deploy File Statis

Setelah instance running (tunggu 2-3 menit):

```bash
# Set environment
export EC2_HOST="203.0.113.10"  # Ganti dengan IP dari output Terraform
export EC2_USER="ubuntu"        # Amazon Linux: ec2-user
export EC2_KEY="~/.ssh/uts-ec2-aryaf.pem"

# Jalankan script deployment
bash scripts/deploy-static.sh
```

### Langkah 3: Verifikasi

```bash
# Smoke test dari komputer lain
DOMAIN=203.0.113.10 bash scripts/smoke-test.sh

# Buka di browser dari HP (data seluler)
http://203.0.113.10/
```

### Langkah 4: Rekam Video dan Dokumentasi

- Buka semua halaman: portofolio, knowledge base, login, dashboard
- Login dengan akun demo: `arya@unsada.ac.id` / `uts2026`
- Centang checklist di dashboard
- Buka knowledge base dan scroll beberapa bagian
- Buka dari HP (data seluler) untuk bukti akses publik

---

## Langkah Deployment EC2 (Manual Console)

Jika tidak mau pakai Terraform:

### 1. Launch Instance

1. Buka EC2 Console → Launch Instance
2. Name: `uts-cloud-portfolio`
3. AMI: Ubuntu 24.04 LTS atau Amazon Linux 2023
4. Instance type: `t3.micro`
5. Key pair: Buat baru atau pakai yang ada
6. Network settings:
   - VPC: default
   - Subnet: public
   - Auto-assign public IP: Enable
7. Security Group:
   - SSH: Port 22, Source: IP Anda /32
   - HTTP: Port 80, Source: 0.0.0.0/0
   - HTTPS: Port 443, Source: 0.0.0.0/0
8. Storage: 8-20 GiB gp3
9. Launch

### 2. SSH ke Instance

```bash
chmod 400 uts-key.pem
ssh -i uts-key.pem ubuntu@PUBLIC-IP
```

### 3. Setup Web Server

```bash
# Update dan install
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git curl

# Buat docroot
sudo mkdir -p /var/www/uts
sudo chown -R $USER:$USER /var/www/uts

# Copy file (dari komputer lokal)
# scp -i uts-key.pem -r index.html assets ubuntu@PUBLIC-IP:/tmp/
# ssh -i uts-key.pem ubuntu@PUBLIC-IP
sudo cp -r /tmp/index.html /tmp/assets /var/www/uts/
sudo chown -R www-data:www-data /var/www/uts
```

### 4. Konfigurasi Nginx

Copy file konfigurasi dari `UTS-EC2-WebHosting/aws-deploy/terraform/user-data.sh` atau buat manual:

```bash
sudo tee /etc/nginx/sites-available/uts > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;
    root /var/www/uts;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(css|js|jpg|png|svg|webp|ico|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/uts /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 5. Verifikasi

```bash
curl -I http://192.168.100.3/
# Dari komputer lain:
curl -I http://PUBLIC-IP/
```

---

## Setup WSL2 untuk Lab Lokal

Sebelum menyentuh EC2, uji konfigurasi di WSL2:

### 1. Install WSL2

```powershell
# PowerShell (admin)
wsl --install -d Ubuntu
wsl --set-default-version 2
```

### 2. Setup Nginx di WSL2

```bash
# Ubuntu (WSL2)
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx

# Enable systemd (jika belum)
echo "[boot]" | sudo tee /etc/wsl.conf
echo "systemd=true" | sudo tee -a /etc/wsl.conf

# Restart WSL dari PowerShell
wsl --shutdown

# Buka lagi dan cek
sudo systemctl status nginx
```

### 3. Copy File ke WSL2

```bash
# Path Windows otomatis ter-mount di /mnt/c
sudo mkdir -p /var/www/uts-lab
sudo cp -r "/mnt/c/laragon/www/UTS Ujian Tengah Semester EC2 Amazon Linux/index.html" /var/www/uts-lab/
sudo cp -r "/mnt/c/laragon/www/UTS Ujian Tengah Semester EC2 Amazon Linux/assets" /var/www/uts-lab/
sudo chown -R www-data:www-data /var/www/uts-lab

# Test
curl -I http://192.168.100.3/
```

### 4. Akses dari LAN (Opsional)

Jika ingin akses dari HP di WiFi yang sama:

```bash
# Jalankan script bridge
bash scripts/wsl2-bridge.sh

# Ikuti instruksi PowerShell yang muncul
# Akses dari HP: http://<IP-WINDOWS>:8080
```

---

## Akun Demo Portal

Untuk presentasi:

- **Email:** `arya@unsada.ac.id`
- **Password:** `uts2026`
- **Nama:** Muhammad Arya Fatthurahman
- **NIM:** 2023230006

Sesi disimpan di `localStorage` browser - tidak ada password yang dikirim ke server.

---

## Cleanup (Setelah Penilaian)

### Cleanup dengan Script

```bash
export AWS_REGION="ap-southeast-1"
export INSTANCE_ID="i-xxxxxxxxxxxxxxxxx"  # Dari output Terraform
export ALLOCATION_ID="eipalloc-xxxxxxxxxxxxxxxxx"  # Dari output Terraform

bash scripts/cleanup-aws.sh
```

### Cleanup Manual

```bash
# 1. Stop instance
aws ec2 stop-instances --instance-ids i-xxxxxxxxxxxxxxxxx

# 2. Release Elastic IP
aws ec2 release-address --allocation-id eipalloc-xxxxxxxxxxxxxxxxx

# 3. Terminate instance
aws ec2 terminate-instances --instance-ids i-xxxxxxxxxxxxxxxxx

# 4. Hapus volume available
aws ec2 describe-volumes --filters Name=status,Values=available
aws ec2 delete-volume --volume-id vol-xxxxxxxxxxxxxxxxx
```

### Dari Console

1. EC2 → Instances → Stop → Terminate
2. EC2 → Elastic IPs → Release
3. EC2 → Volumes → Delete yang available
4. Billing → Cost Explorer → Cek tagihan

---

## Troubleshooting

### Connection Timed Out

- Periksa Security Group: port 80 harus terbuka ke 0.0.0.0/0
- Periksa instance state: harus running dengan 2/2 checks passed
- Periksa Elastic IP: harus associated

### Connection Refused

- Cek service: `sudo systemctl status nginx`
- Cek listener: `sudo ss -tlnp | grep :80`
- Pastikan Nginx running: `sudo systemctl start nginx`

### 403 Forbidden

- Cek permission: `sudo chmod 755 /var/www/uts` dan `sudo chmod 644 /var/www/uts/*`
- Cek SELinux (Amazon Linux): `sudo chcon -R -t httpd_sys_content_t /var/www/uts`

### CSS/JS 404

- Pastikan folder `assets/` terupload
- Cek path: `/var/www/uts/assets/`
- Cek Nginx log: `sudo tail -f /var/log/nginx/error.log`

### SSH Permission Denied

- Cek user: Ubuntu = `ubuntu`, Amazon Linux = `ec2-user`
- Cek permission key: `chmod 400 key.pem`
- Cek Security Group: port 22 hanya terbuka untuk IP Anda /32

---

## Biaya Estimasi (Jakarta Region)

- **t3.micro:** ~$0.0104/jam (free tier tergantung akun)
- **20 GB gp3:** ~$0.08/GB/bulan = ~$1.6/bulan
- **Elastic IP (idle):** ~$0.005/jam = ~$3.6/bulan jika tidak terpasang
- **Data transfer:** bervariasi

**Total untuk 3 hari UTS:** ~$2-5 jika hati-hati dengan cleanup.

---

## Referensi

- AWS EC2: https://docs.aws.amazon.com/ec2/
- Nginx: https://nginx.org/en/docs/
- Terraform: https://developer.hashicorp.com/terraform/docs
- Roadmap DevOps: https://roadmap.sh/devops

---

## File Utama

- `index.html` - Portofolio
- `knowledge.html` - Knowledge base lengkap
- `login.html` - Login page
- `dashboard.html` - Workspace
- `assets/js/portal.js` - Logika portal (localStorage)
- `scripts/deploy-static.sh` - Script deployment
- `scripts/smoke-test.sh` - Script verifikasi
- `scripts/cleanup-aws.sh` - Script cleanup
- `UTS-EC2-WebHosting/aws-deploy/terraform/` - Terraform config
- `docs/` - Dokumentasi tambahan

---

**Catatan Akademik**

Project ini adalah hasil UTS Cloud Computing Program Studi Teknologi Informasi, Universitas Darma Persada. Seluruh konfigurasi ditulis ulang dan disesuaikan dengan kebutuhan tugas. Source eksternal dipakai sebagai rujukan, bukan disalin mentah.
