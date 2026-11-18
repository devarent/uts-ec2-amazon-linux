# UTS Cloud Computing — AWS EC2

**Tugas UTS Cloud Computing — Semester 8**

- **Nama lengkap:** Muhammad Arya Fatthurahman
- **NIM:** 2023230006
- **Kelas:** TIFM
- **Program Studi:** S1 Teknologi Informasi
- **Universitas:** Universitas Darma Persada (UNSADA)
- **Deadline pengumpulan:** 19 November 2026, 23.59 WIB (EdLink)
- **Jenis tugas:** Individu (Platform: AWS EC2 — Ubuntu/Amazon Linux, Web Server: Apache2/Nginx)

---

Lab lengkap: **Next.js 16 + Tailwind CSS 4** dengan **PostgreSQL 17** yang di-deploy ke **AWS EC2** memakai **Docker Compose**, **Nginx**, dan **HTTPS**, lalu diotomasi dengan **Terraform**, **Helm/Kubernetes**, dan **GitHub Actions**. Aplikasi mencakup akun login, checklist deployment per pengguna, dan guestbook yang tersimpan di PostgreSQL.

Repo ini adalah pasangan dari video *UTS Cloud Computing — AWS EC2*: launch instance, security group, connect, sampai aplikasi hidup di **Public IP** (bukan localhost).

> **Prinsip UTS ini:** jangan deploy aplikasi yang belum jalan di localhost, dan jangan buka port 3000 ke internet.

---

## Daftar isi

- [Yang kamu dapat](#yang-kamu-dapat)
- [Struktur repo](#struktur-repo)
- [Prasyarat](#prasyarat)
- [Quick start lokal](#quick-start-lokal)
- [Akun dan workspace deployment](#akun-dan-workspace-deployment)
- [Konfigurasi deployment dari WSL2](#konfigurasi-deployment-dari-wsl2)
- [UTS — Launch EC2 (mengikuti video)](#part-1--launch-ec2-mengikuti-video)
- [Part 2 — Connect & bootstrap Docker](#part-2--connect--bootstrap-docker)
- [Part 3 — Deploy dengan Docker Compose + Nginx](#part-3--deploy-dengan-docker-compose--nginx)
- [Database: Docker PostgreSQL atau AWS RDS](#database-docker-postgresql-atau-aws-rds)
- [Part 4 — Domain + HTTPS](#part-4--domain--https)
- [Part 5 — Terraform (opsional, lebih rapi)](#part-5--terraform-opsional-lebih-rapi)
- [Part 6 — CI/CD GitHub Actions](#part-6--cicd-github-actions)
- [Part 7 — Kubernetes + Helm (naik kelas)](#part-7--kubernetes--helm-naik-kelas)
- [Monitoring & observability](#monitoring--observability)
- [Troubleshooting cepat](#troubleshooting-cepat)
- [Biaya & cleanup](#biaya--cleanup)
- [Checklist UTS](#checklist-part-1)
- [Referensi](#referensi)

---

## Yang kamu dapat

| Lapisan | File / teknologi |
| --- | --- |
| App | `app/` — Next.js 16, React 19, Tailwind 4, landing, login, dashboard, API `/api/health`, `/api/auth/*`, `/api/deployment` |
| Database | `db/init/` + `app/lib/db.ts` — PostgreSQL 17, volume `db-data`, guestbook, akun, sesi, dan progres checklist |
| Container | `app/Dockerfile` multi-stage, standalone output, non-root, healthcheck |
| Runtime EC2 | `docker-compose.yml`, `nginx/`, `scripts/` — app + db + adminer + nginx + certbot |
| Infra as Code | `terraform/` — VPC, subnet, SG, IAM SSM, EC2, Elastic IP, Route 53 |
| Orchestrasi | `helm/nextjs-app/` + `k8s/` (Deployment, Service, Ingress, HPA, PDB) |
| CI/CD | `.github/workflows/ci.yml`, `deploy-ec2.yml`, `deploy-k8s.yml` |
| Dokumentasi | `docs/` - pendalaman tiap tahap, 01-14 (termasuk `docs/10-database.md`, `docs/13-aws-architecture-qanda.md`, `docs/14-nextjs-ai-production.md`) |
| Panduan cetak | `docs/Panduan-UTS-Cloud-Computing.pdf` dan `.docx` (bahasa Indonesia) |

Arsitektur target:

```text
User
  │  https://app.example.com
  ▼
Route 53 (A → Elastic IP)
  ▼
EC2 · Nginx :443  ── :80 redirect + ACME challenge
  │  Docker network `edge`
  └── Next.js standalone :3000  ── /api/health, /api/guestbook
        │  Docker network `data` (internal)
        ├── PostgreSQL 17 :5432  ── volume `db-data` (persisten)
        └── Adminer (profil tools, loopback :8090) ── opsional via SSH tunnel
```

---

## Struktur repo

```text
.
├── app/                      # Next.js + Tailwind
│   ├── app/                  # App Router (landing, login, register, dashboard, guide, API)
│   ├── components/           # Auth, deployment dashboard, configurator, guestbook, chat
│   ├── lib/                  # Auth/session, pilihan lab, dan koneksi PostgreSQL
│   ├── Dockerfile
│   └── package.json
├── db/init/                  # SQL init (dijalankan saat volume db-data pertama kali dibuat)
├── docker-compose.yml        # app + db + nginx + adminer/tools + certbot/tls
├── nginx/templates/          # template Nginx (envsubst)
├── terraform/                # EC2, VPC, SG, EIP, Route 53
├── helm/nextjs-app/          # Chart Helm
├── k8s/                      # Manifest mentah + kustomization
├── backups/                  # Hasil pg_dump (tidak di-commit)
├── scripts/                  # bootstrap, deploy, cert, backup/restore, cleanup, smoke test
├── .github/workflows/        # CI + deploy EC2 + deploy K8s
└── docs/                     # panduan detail
```

---

## Prasyarat

- Akun AWS (free tier cukup) dan akses ke region **ap-southeast-3 (Jakarta)** atau region terdekat.
- Domain (opsional untuk HTTPS; bisa beli di Route 53/Cloudflare/Namecheap).
- Lokal: Node.js ≥ 20.9, Docker Desktop, Git.
- Opsional: Terraform ≥ 1.9, `kubectl`, `helm`.
- SSH client (`ssh`) atau fitur **EC2 Instance Connect** di browser.

---

## Quick start lokal

Cara tercepat: jalankan app + PostgreSQL lewat Docker Compose (database tidak perlu di-install di laptop).

```bash
# Setup database dengan password aman (opsional tapi disarankan)
bash scripts/setup-db.sh

# Atau manual
cp .env.example .env
# edit POSTGRES_PASSWORD & ADMIN_TOKEN, boleh biarkan domain default
docker compose up -d --build db app
curl -s 192.168.100.3:3000/api/health
```

Health check akan menampilkan status database:

```json
{"status":"ok","db":{"status":"up","latency_ms":5}, ...}
```

Buka <http://192.168.100.3:3000>, tulis pesan di bagian **Guestbook**, lalu cek datanya:

```bash
docker compose exec db psql -U ec2lab -d ec2lab -c 'SELECT * FROM guestbook;'
```

### Akun dan workspace deployment

Buka <http://192.168.100.3:3000/register> untuk membuat akun, lalu masuk ke
workspace. Akun disimpan per pengguna; password di-hash dengan `scrypt`, sesi
disimpan sebagai hash token dengan masa berlaku 7 hari, dan konfigurasi/checklist
masuk ke tabel PostgreSQL `deployment_progress`. Password tidak pernah disimpan
di browser atau dikirim kembali ke client.

Dashboard berisi sembilan tahap dengan pilihan EC2/region, jaringan, OS/Docker,
database, Nginx/TLS, DNS, IaC, CI/CD, dan Kubernetes. Pilihan serta tanda
verifikasi disimpan setelah menekan **Simpan pilihan**. Bagian **AWS
CodePipeline** juga menyediakan formulir Source (Bitbucket/GitHub), Build
(CodeBuild), dan Deploy (CodeDeploy), dengan field action, region, repository,
branch, artifacts, buildspec, environment variables, aplikasi, dan deployment
group. Konfigurasi tersimpan per akun di tabel PostgreSQL
`pipeline_configurations`. Formulir tidak menyimpan credential atau secret;
simpan itu di AWS Connections, IAM, atau Secrets Manager.

Kesembilan tahap menyimpan pilihan dan status verifikasinya secara terpisah
per pengguna di tabel PostgreSQL `deployment_progress`. Masing-masing tahap
juga punya konfigurasi detail tersendiri di `lab_section_configurations`
(JSONB per pengguna dan nomor tahap): EC2, network, Linux/Docker, database,
Nginx/TLS, DNS/IP, IaC, CI/CD, dan Kubernetes. Workspace **Database** menyimpan
detail engine, region, kapasitas, storage, jaringan privat, enkripsi, dan
backup di `database_configurations`; konfigurasi tahap 04 disinkronkan dalam
transaksi yang sama. Tombol simpan hanya mencatat konfigurasi: aplikasi tidak
menjalankan Terraform plan/apply dan tidak membuat atau mengubah resource AWS.
Tidak ada secret database yang disimpan; akses publik database dan port aplikasi
dikunci nonaktif.

Tampilan console kini memakai tema terang dan menyediakan pencarian Quick Start
AMI referensi, ringkasan launch EC2, metadata key pair/tag, serta editor inbound
rules. Daftar AMI bersifat lokal (bukan katalog AWS live); AMI ID harus
diverifikasi pada region/arsitektur yang dipilih. Inbound port 22 harus berupa
IP admin `/32`, sedangkan port 3000 dan port database tidak dapat dibuka publik.

Database workspace memiliki pencarian provider untuk PostgreSQL/MySQL/MariaDB,
SQL Server, Oracle, Aurora, Redshift Serverless, DocumentDB, Neptune,
ElastiCache, OpenSearch, serta endpoint eksternal `localhost`, IPv4, DNS, atau
nama service Docker. Endpoint eksternal hanya metadata konfigurasi—aplikasi
tidak menyimpan credential, mencoba koneksi, membuka port, atau mengubah
`DATABASE_URL`. `localhost` di container menunjuk ke container itu sendiri;
untuk Docker Desktop pertimbangkan `host.docker.internal`.

Menyimpan checklist, pipeline, atau database tidak menjalankan `terraform
apply` maupun deployment. Resource AWS tetap harus ditinjau dan diterapkan
secara terpisah dari WSL2 bila memang diinginkan.

Landing awal di `/`, login di `/login`, pendaftaran di `/register`, workspace di
`/dashboard`, dan panduan publik di `/guide`.

Untuk konfigurasi database di Compose, salin `.env.example` ke `.env`.
PostgreSQL lokal aktif secara default saat `docker compose up`; untuk uji app
saja jalankan `docker compose up -d --build db app`.
Volume `db-data` menyimpan data saat container dibuat ulang. Jangan jalankan
`docker compose down -v` jika ingin mempertahankan database.
Jika memakai RDS, isi `DATABASE_URL`, set `DATABASE_SSL=true`, lalu gunakan
`docker-compose.rds.yml` agar service database lokal tidak ikut berjalan.

Ingin mode development dengan hot reload? Jalankan database saja, lalu `npm run dev`:

```bash
docker compose up -d db
cd app
cp .env.example .env
# sesuaikan: DATABASE_URL=postgres://ec2lab:<password>@127.0.0.1:5433/ec2lab
npm ci
npm run dev
```

> Port host database sengaja memakai **5433** (container tetap 5432) agar tidak bentrok dengan PostgreSQL lokal. Di dalam Docker Compose, app memakai `db:5432` lewat network internal.

Build image manual (tanpa database, health DB akan `not_configured`):

```bash
docker build -t ec2-lab ./app
docker run --rm -p 3000:3000 --name ec2-lab ec2-lab
```

> `nginx` membutuhkan sertifikat TLS. Untuk lokal, cukup jalankan service `app` + `db`, atau gunakan `npm run dev`.

---

## Konfigurasi deployment dari WSL2

Bagian **Konfigurasi & Apply** di halaman aplikasi dapat menghasilkan
`terraform.tfvars` dan perintah untuk membuat satu EC2. Pilih PostgreSQL di
Docker untuk jalur UTS (default), atau pilih RDS untuk database terkelola
di subnet privat. IP admin yang diisi pada form dibatasi sebagai sumber SSH
`/32`. Masukkan juga nama key pair RSA yang sudah tersedia pada region itu;
Elastic IP EC2 dialokasikan otomatis oleh Terraform.

Wizard tidak menjalankan perintah AWS dari browser. Dari WSL2, siapkan AWS CLI
dan Terraform, salin file hasil generate ke `terraform/terraform.tfvars`, lalu
jalankan perintah yang ditampilkan. Selalu tinjau `terraform plan` sebelum
`terraform apply`. Untuk RDS, set `TF_VAR_rds_master_password` di terminal;
jangan simpan password di `.tfvars` atau commit ke Git. RDS dikenakan biaya
tambahan dan hanya dapat diakses dari EC2 dalam VPC.

Untuk memakai database lokal WSL2 tanpa membuat resource AWS:

```bash
bash scripts/setup-db.sh
docker compose up -d --build db app
curl -fsS http://192.168.100.3:3000/api/health
```

Port database host hanya terikat ke `127.0.0.1:5433`; jangan membuka port
5432 atau 3000 ke internet.

---

## UTS — Launch EC2 (mengikuti video)

### 1.1 Launch instance

Ikuti tampilan di video, dengan satu perbedaan penting: **jangan buka All traffic**.

1. Buka **EC2 → Instances → Launch an instance**.
2. **Name**: `SERVER AWS AJI` (bebas).
3. **AMI**: **Debian 13** (64-bit x86). Ubuntu 24.04 juga boleh — sesuaikan user SSH (`admin` vs `ubuntu`).
4. **Instance type**: `t3.micro` (free tier eligible).
5. **Key pair**: **Create new key pair** → nama `awskeypair` → tipe **RSA** → format **.pem** → download. Simpan file itu; tidak bisa diunduh ulang.
6. **Network settings** → **Create security group**:
   - Allow SSH from **My IP** (bukan Anywhere).
   - Allow HTTP from internet.
   - Allow HTTPS from internet.
7. **Storage**: 20 GiB gp3 (video memakai 8 GiB; 20 GiB lebih aman untuk image Docker).
8. **Launch instance**.

> Video membuka `All traffic` dari `0.0.0.0/0` agar mudah. Itu **tidak aman** dan tidak diperlukan. Cukup 22 (IP kamu), 80, 443.

### 1.2 Rapikan security group

1. **EC2 → Security Groups** → pilih SG yang dibuat wizard (`launch-wizard-1`) → **Edit name** → `mySecurity`.
2. **Inbound rules** → pastikan hanya:

| Type | Port | Source |
| --- | --- | --- |
| SSH | 22 | IP publik kamu `/32` |
| HTTP | 80 | `0.0.0.0/0` |
| HTTPS | 443 | `0.0.0.0/0` |

3. Hapus rule `All traffic` bila ada.
4. (Disarankan) **Elastic IPs → Allocate Elastic IP → Associate** ke instance. Tanpa EIP, public IP berubah setiap stop/start dan DNS ikut rusak.

### 1.3 Tunggu status checks

Instance dianggap siap ketika **Status check = 3/3 passed** (biasanya 1–3 menit).

---

## Part 2 — Connect & bootstrap Docker

### 2.1 Connect

Opsi A — browser: pilih instance → **Connect → EC2 Instance Connect → Connect**.

Opsi B — SSH dari laptop:

```bash
chmod 400 awskeypair.pem
ssh -i awskeypair.pem admin@<ELASTIC_IP>
```

Windows PowerShell (tanpa WSL):

```powershell
ssh -i .\awskeypair.pem admin@<ELASTIC_IP>
```

> User default Debian adalah `admin`, Ubuntu adalah `ubuntu`.

### 2.2 Clone repo & bootstrap

```bash
sudo apt-get update && sudo apt-get install -y git
sudo git clone https://github.com/<kamu>/<repo>.git /opt/app
sudo chown -R "$USER":"$USER" /opt/app
cd /opt/app

sudo bash scripts/setup-ec2.sh
```

Script akan memasang Docker Engine + Compose v2, swap 2 GB (penting untuk 1 GB RAM), ufw 22/80/443, cron cleanup, cron backup database harian (03:30), dan cron renew sertifikat.

Logout/login (atau `newgrp docker`) agar user bisa memakai Docker tanpa `sudo`.

```bash
docker run --rm hello-world
docker compose version
```

---

## Part 3 — Deploy dengan Docker Compose + Nginx

### 3.1 Konfigurasi environment

```bash
cd /opt/app
cp .env.example .env
chmod 600 .env
nano .env
```

Isi minimal:

```dotenv
DOMAIN=app.example.com
NEXT_PUBLIC_SITE_URL=https://app.example.com
APP_IMAGE=ghcr.io/owner/repo:latest

POSTGRES_DB=ec2lab
POSTGRES_USER=ec2lab
POSTGRES_PASSWORD=<password-kuat-url-safe>
ADMIN_TOKEN=<token-acak-untuk-hapus-pesan>
```

`OPENAI_API_KEY` opsional. Tanpa key, `/api/ai` memakai knowledge base lokal.

> Password database harus **URL-safe** (huruf, angka, `-`, `_`) karena dipakai di `DATABASE_URL`. Buat dengan `openssl rand -base64 24 | tr '+/' '-_' | tr -d '='`. Jika ingin karakter khusus, set `DATABASE_URL` manual di `.env` dan pastikan sama dengan `POSTGRES_*`.

### 3.2 Build & jalankan app + database

Database harus sehat sebelum app start (`depends_on: condition: service_healthy`). Saat volume `db-data` pertama kali dibuat, file `db/init/001-schema.sql` otomatis menjalankan schema guestbook.

```bash
docker compose up -d --build db app
docker compose ps
curl -s 192.168.100.3:3000/api/health
```

Keluaran yang diharapkan:

```json
{"status":"ok","db":{"status":"up","latency_ms":5}}
```

Bila memakai image dari GHCR:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u <username> --password-stdin
docker compose up -d db app
```

> `REQUIRE_DB=true` di Compose membuat `/api/health` mengembalikan **503** saat database mati. Ini disengaja agar deploy tidak dianggap sukses kalau database tidak siap.

### 3.3 Terbitkan sertifikat (butuh domain)

Pastikan **A record** `app.example.com` sudah mengarah ke Elastic IP, lalu:

```bash
DOMAIN=app.example.com EMAIL=kamu@email.com sudo -E bash scripts/issue-cert.sh
```

Script ini:

1. cek DNS vs IP publik,
2. stop nginx sementara,
3. menerbitkan sertifikat dengan `certbot --standalone` (port 80),
4. menyalakan nginx kembali.

### 3.4 Nyalakan Nginx

```bash
docker compose up -d
docker compose ps
```

Buka `https://app.example.com`. Cek juga:

```bash
curl -I https://app.example.com
curl -s https://app.example.com/api/health
curl -s https://app.example.com/api/guestbook
DOMAIN=app.example.com bash scripts/smoke-test.sh
```

### 3.5 Deploy berikutnya

```bash
APP_IMAGE=ghcr.io/owner/repo:sha-abc1234 bash scripts/deploy.sh
```

`deploy.sh` menyimpan image lama, pull image baru, menunggu `/api/health`, dan rollback otomatis bila gagal.

Detail: [`docs/02-docker-nginx.md`](docs/02-docker-nginx.md)

---

## Database: Docker PostgreSQL atau AWS RDS

Project ini mendukung dua opsi database:

### Opsi 1: PostgreSQL di dalam EC2 (Default)

Database **tidak memakai RDS**; PostgreSQL 17 berjalan sebagai container di EC2 yang sama. Tujuannya supaya lab ini benar-benar self-contained: satu `docker compose up` menghidupkan app + database.

### Opsi 2: AWS RDS PostgreSQL (Managed)

Untuk production atau jika kamu ingin database managed dengan automatic backup, Multi-AZ, dan scaling. Lihat [`docs/11-rds-setup.md`](docs/11-rds-setup.md) untuk setup lengkap.

### Perbandingan

| Fitur | Docker PostgreSQL | AWS RDS PostgreSQL |
|-------|------------------|-------------------|
| **Cost** | Free (uses EC2 resources) | ~$15-20/month minimum |
| **Setup** | Simple (docker compose) | Terraform configuration |
| **Backups** | Manual (scripts) | Automatic (configurable) |
| **High Availability** | Manual (single instance) | Multi-AZ option |
| **Monitoring** | Basic (Docker logs) | CloudWatch + Performance Insights |
| **Maintenance** | Manual (you manage) | Automatic (AWS manages) |

### Setup cepat

**Untuk Docker PostgreSQL:**

```bash
# Setup database dengan password aman (opsional tapi disarankan)
bash scripts/setup-db.sh

# Atau manual
cp .env.example .env
# edit POSTGRES_PASSWORD & ADMIN_TOKEN, boleh biarkan domain default
docker compose up -d --build db app
curl -s 192.168.100.3:3000/api/health
```

**Untuk AWS RDS:**

Ikuti panduan [AWS RDS PostgreSQL](docs/11-rds-setup.md). Compose sudah
menghormati `DATABASE_URL` dari `.env`; tidak perlu mengedit atau menghapus
service dari `docker-compose.yml`.

Detail lengkap Docker: [`docs/DATABASE_SETUP.md`](docs/DATABASE_SETUP.md)  
Detail lengkap RDS: [`docs/11-rds-setup.md`](docs/11-rds-setup.md)

### Komponen

| Komponen | Fungsi |
| --- | --- |
| `db` | PostgreSQL 17 (`postgres:17-alpine`), volume `db-data`, healthcheck `pg_isready` |
| `db/init/001-schema.sql` | membuat tabel `guestbook` saat volume pertama kali dibuat |
| `app/lib/db.ts` | pool `pg`, bootstrap schema idempoten, helper CRUD & health |
| `/api/guestbook` | `GET` daftar pesan, `POST` pesan baru, `DELETE` dengan token admin |
| `adminer` | UI database, profil `tools`, hanya bind `127.0.0.1:8090` |
| `scripts/backup-db.sh` | `pg_dump` harian ke `backups/` (cron 03:30) |
| `scripts/restore-db.sh` | `pg_restore` dengan konfirmasi |

### Keamanan jaringan

- Port `5432` **tidak** dibuka ke internet. Security Group hanya 22, 80, 443.
- Di Docker, app terhubung lewat `db:5432` pada network internal `edge`.
- Mapping ke host hanya `127.0.0.1:5433` (loopback), untuk `npm run dev`/psql.
- Adminer juga loopback (`127.0.0.1:8090`). Akses dari laptop lewat SSH tunnel:

```bash
ssh -L 8090:127.0.0.1:8090 admin@<ELASTIC_IP>
# lalu di EC2:
cd /opt/app && docker compose --profile tools up -d adminer
# buka http://192.168.100.3:8090 di laptop
# server: db · user: ec2lab · password: dari .env · database: ec2lab
```

### Guestbook API

```bash
# daftar pesan
curl -s https://app.example.com/api/guestbook

# kirim pesan
curl -s -X POST https://app.example.com/api/guestbook \
  -H 'Content-Type: application/json' \
  -d '{"name":"Arya","message":"Halo dari EC2"}'

# hapus pesan (butuh ADMIN_TOKEN)
curl -s -X DELETE -H "x-admin-token: $ADMIN_TOKEN" \
  "https://app.example.com/api/guestbook?id=1"
```

Validasi: nama 2–80 karakter, pesan 3–500 karakter. `DELETE` mengembalikan `401` bila token salah/kosong.

### Backup & restore

Backup otomatis dipasang oleh `scripts/setup-ec2.sh` lewat `/etc/cron.d/db-backup`:

```bash
# manual
cd /opt/app
APP_DIR=/opt/app bash scripts/backup-db.sh

# restore (data saat ini ditimpa)
bash scripts/restore-db.sh backups/ec2lab-20260101T033000Z.dump
```

- Format `pg_dump --format=custom`, retensi 7 hari (`KEEP_DAYS`).
- File disimpan di `/opt/app/backups/` dengan permission `600`.
- Salin keluar dari EC2 secara berkala: `scp admin@<ip>:/opt/app/backups/*.dump .`

### Reset database (hati-hati)

```bash
docker compose down            # container berhenti, volume tetap
docker compose down -v         # volume db-data ikut terhapus -> data hilang
docker compose up -d db app    # schema init dijalankan ulang
```

> `docker compose down` biasa **tidak** menghapus data. Jangan pakai `-v` kecuali memang ingin mulai dari nol.

### Migrasi schema

Untuk UTS, schema dibuat idempoten oleh `db/init` + `lib/db.ts`. Untuk perubahan berikutnya, tambahkan file SQL baru di `db/migrations/` dan jalankan manual (atau pakai tool seperti Prisma/Drizzle/node-pg-migrate). Catatan: file di `db/init/` **hanya** dieksekusi saat volume masih kosong.

Detail lengkap: [`docs/10-database.md`](docs/10-database.md)

---

## Part 4 — Domain + HTTPS

Ringkas:

1. **Route 53** (atau DNS provider lain): buat **A record** → Elastic IP. TTL 300.
2. Tunggu propagasi: `dig +short app.example.com` atau `nslookup`.
3. Terbitkan sertifikat: `scripts/issue-cert.sh`.
4. Nginx mengarahkan 80 → 443 dan memakai `fullchain.pem`/`privkey.pem`.
5. Perpanjangan otomatis: cron 02:30 & 14:30 menjalankan `scripts/renew-cert.sh` dan reload nginx.
6. Uji: `openssl s_client -connect app.example.com:443 -servername app.example.com </dev/null 2>/dev/null | openssl x509 -noout -dates`.

> Jangan aktifkan HSTS `max-age` panjang sebelum HTTPS stabil. Template ini memakai 1 hari agar aman saat latihan.

Detail: [`docs/03-domain-https.md`](docs/03-domain-https.md)

---

## Part 5 — Terraform (opsional, lebih rapi)

Daripada klik-klik console, buat infrastruktur yang sama dengan kode.

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# edit ssh_cidr, ssh_public_key / key_name, domain (opsional)
terraform init
terraform fmt -recursive
terraform validate
terraform plan -out tfplan
terraform apply tfplan
```

Output penting:

```text
public_ip   = "16.78.1.204"
app_url     = "https://app.example.com"
ssm_command = "aws ssm start-session --target i-..."
```

Yang dibuat:

- VPC + 2 public subnet (Multi-AZ) + IGW + route table
- Security group (22 terbatas, 80, 443)
- IAM role + instance profile (SSM + CloudWatch, tanpa access key)
- EC2 Debian 13 + IMDSv2 + disk terenkripsi
- Elastic IP + asosiasi
- Route 53 A record (jika `domain_name` & `hosted_zone_name` diisi)

Setelah apply, lanjutkan clone repo & `scripts/setup-ec2.sh` seperti Part 2–3. Atau gunakan SSM tanpa membuka port 22:

```bash
aws ssm start-session --target <instance-id> --region ap-southeast-3
```

Hapus semua:

```bash
terraform destroy
```

Detail: [`docs/04-terraform.md`](docs/04-terraform.md)

---

## Part 6 — CI/CD GitHub Actions

Tiga workflow utama:

| Workflow | Trigger | Isi |
| --- | --- | --- |
| `ci.yml` | push/PR ke `app/**` | typecheck, build, docker build, smoke test app + PostgreSQL + guestbook |
| `deploy-ec2.yml` | push ke `main` | build → GHCR → SSH deploy → health check (termasuk DB) → rollback |
| `deploy-k8s.yml` | manual | build → `helm upgrade --install --atomic` |

### Secrets yang dibutuhkan

| Name | Isi |
| --- | --- |
| `EC2_HOST` | Elastic IP atau domain |
| `EC2_USER` | `admin` (Debian) / `ubuntu` |
| `EC2_SSH_KEY` | isi private key `.pem` |
| `EC2_PORT` | opsional, default 22 |
| `GHCR_TOKEN` | PAT `read:packages` (opsional; fallback `GITHUB_TOKEN`) |
| `KUBE_CONFIG` | base64 kubeconfig (untuk deploy K8s) |

### Variables (Settings → Variables)

| Name | Contoh |
| --- | --- |
| `SITE_URL` | `https://app.example.com` |
| `APP_DIR` | `/opt/app` |
| `APP_HOST` | `app.example.com` |

### Alur deploy

```text
git push main
  → build image (tag sha-xxxxxxx, immutable)
  → push GHCR
  → ssh ke EC2
  → git reset --hard origin/main (compose/nginx/scripts terbaru)
  → docker compose pull + up -d (db + app + nginx)
  → polling /api/health (60 × 2s), DB harus `up`
  → gagal? rollback ke image sebelumnya, job merah
  → sukses? prune image lama
```

> Catatan database: CI menjalankan `postgres:17-alpine` sebagai service sementara di network `ci-net`. Di EC2, database memakai volume `db-data` yang persisten. Deploy tidak menyentuh volume, jadi data guestbook aman saat image/app di-update.

> Catatan: `GITHUB_TOKEN` bisa dipakai untuk pull package privat selama workflow berada di repo yang sama. Untuk organisasi/private package, buat PAT `read:packages` dan simpan sebagai `GHCR_TOKEN`.

Detail: [`docs/05-cicd.md`](docs/05-cicd.md)

---

## Part 7 — Kubernetes + Helm (naik kelas)

EC2 + Docker sudah cukup untuk UTS. Kubernetes dipakai saat butuh:

- banyak service dan scaling horizontal,
- rolling update dengan probe yang lebih kaya,
- self-healing dan penjadwalan multi-node.

Coba di lokal dulu (k3d/minikube/kind), lalu EKS:

```bash
helm lint helm/nextjs-app
helm template nextjs helm/nextjs-app --set image.repository=ghcr.io/owner/repo
helm upgrade --install nextjs ./helm/nextjs-app \
  --namespace ec2-lab --create-namespace \
  --set image.repository=ghcr.io/owner/repo \
  --set image.tag=sha-abc1234 \
  --set ingress.hosts[0].host=app.example.com \
  --set ingress.tls[0].hosts[0]=app.example.com \
  --atomic --wait
```

Atau manifest mentah:

```bash
kubectl apply -k k8s
kubectl get pods,svc,ingress -n ec2-lab
```

Chart menyertakan Deployment, Service, Ingress, HPA, PDB, ConfigMap, Secret opsional, security context non-root, read-only root filesystem, dan probe `/api/health`.

> **Database di Kubernetes:** chart ini **tidak** membawa PostgreSQL. Untuk K8s, pakai database eksternal (RDS/Aurora, Cloud SQL, atau operator seperti CloudNativePG) lalu isi `DATABASE_URL` lewat Secret dan set `REQUIRE_DB=true`. Menjalankan database stateful di cluster yang sama bisa dilakukan, tapi butuh StatefulSet + PVC + backup sendiri — di luar cakupan UTS. Contoh ada di `helm/nextjs-app/values.yaml`.

Detail: [`docs/06-kubernetes-helm.md`](docs/06-kubernetes-helm.md)

---

## Monitoring & observability

Minimal yang harus ada:

1. **Health endpoint** — `/api/health` dipakai Docker, Nginx, CI, dan K8s.
2. **CloudWatch** — alarm `StatusCheckFailed`, CPU > 80%, disk > 80%.
3. **Log** — `docker compose logs -f app` (json-file, max 10 MB × 3).
4. **Uptime eksternal** — UptimeRobot/Better Stack ke `/api/health` tiap 1 menit.
5. **Sentry** (opsional) — error aplikasi; Grafana/CloudWatch untuk metrik.

Pasang alarm contoh:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name ec2-lab-status-check \
  --namespace AWS/EC2 \
  --metric-name StatusCheckFailed \
  --statistics Maximum --period 60 --evaluation-periods 2 \
  --threshold 1 --comparison-operator GreaterThanOrEqualToThreshold \
  --dimensions Name=InstanceId,Value=<instance-id> \
  --alarm-actions <arn-sns-topic>
```

---

## Troubleshooting cepat

| Gejala | Cek |
| --- | --- |
| SSH timeout | SG port 22, IP berubah, instance running, EIP |
| `permission denied (publickey)` | user salah (`admin` vs `ubuntu`), permission `.pem` 400 |
| Nginx `[emerg] cannot load certificate` | sertifikat belum diterbitkan / `DOMAIN` di `.env` salah |
| `502 Bad Gateway` | container app mati: `docker compose ps`, `logs app` |
| Health check CI gagal | app butuh env yang hilang, port salah, build tidak standalone |
| `/api/health` 503, `db.status=down` | `docker compose ps db`, `logs db`, cek password/`DATABASE_URL` |
| Guestbook `database_not_configured` | `DATABASE_URL` tidak di-set di environment app |
| Guestbook kosong setelah redeploy | normal bila volume baru; cek `docker volume ls` dan jangan pakai `down -v` |
| Adminer tidak bisa dibuka | bind hanya loopback; pakai SSH tunnel `-L 8090:127.0.0.1:8090` |
| `docker compose pull` denied | belum login GHCR / package private / token kurang scope |
| Domain tidak resolve | A record, TTL, nameserver, propagasi |
| Disk penuh | `docker system df`, jalankan `docker-cleanup` |
| OOM saat build di t3.micro | build di CI, bukan di EC2; atau tambah swap |

Detail + perintah debug: [`docs/07-troubleshooting.md`](docs/07-troubleshooting.md)

---

## Biaya & cleanup

Perkiraan lab (region Jakarta, di luar free tier):

- t3.micro: ~$0.0104/jam
- 20 GB gp3: ~$0.08/GB/bulan
- Elastic IP idle: ~$0.005/jam (saat tidak terasosiasi)
- Transfer data: bervariasi

**Wajib:** pasang AWS Budgets alert (mis. $1 dan $5), lalu bersihkan:

```bash
docker system prune -af
cd terraform && terraform destroy    # jika memakai Terraform
# atau: terminate instance + release Elastic IP dari console
```

Jangan hanya stop instance — EBS dan EIP tetap ditagih.

---

## Checklist UTS

- [ ] Instance Debian 13 `t3.micro` running, status 3/3
- [ ] Security group hanya 22 (IP kamu), 80, 443
- [ ] Elastic IP terasosiasi
- [ ] SSH / EC2 Instance Connect berhasil
- [ ] Docker + Compose v2 aktif
- [ ] `docker compose up -d` sukses (db, app, nginx)
- [ ] `/api/health` 200 dan `db.status = up`
- [ ] Guestbook bisa menyimpan pesan dan data bertahan setelah `docker compose restart`
- [ ] Backup database jalan (`backups/*.dump`) dan restore diuji
- [ ] Domain A record benar
- [ ] HTTPS valid dan redirect 80 → 443
- [ ] `scripts/smoke-test.sh` lulus
- [ ] Pipeline CI hijau
- [ ] Budget alert aktif
- [ ] Tahu cara rollback & cleanup

---

## Referensi

Lihat [docs/12-references.md](docs/12-references.md) untuk artikel, panduan
deployment, serta dokumentasi Terraform/OpenTofu yang diminta.

- Video: <https://www.youtube.com/watch?v=b6_ZDTERzm0>
- Artikel, repository, Gist, dan dokumentasi provider yang digunakan:
  [docs/12-references.md](docs/12-references.md) (12 referensi).
- AWS EC2: <https://docs.aws.amazon.com/ec2/>
- Docker multi-stage: <https://docs.docker.com/build/building/multi-stage/>
- Next.js self-hosting: <https://nextjs.org/docs/app/getting-started/deploying>
- Terraform AWS provider: <https://registry.terraform.io/providers/hashicorp/aws/latest/docs>
- Helm: <https://helm.sh/docs/>
- Certbot: <https://certbot.eff.org/>
- Roadmap DevOps: <https://roadmap.sh/devops>

Catatan teori AWS (VPC, IAM, ECS, RDS, SQS, CloudFront, Route 53, Well-Architected) diringkas di [`docs/08-aws-architecture-notes.md`](docs/08-aws-architecture-notes.md). Detail database lokal di EC2 ada di [`docs/10-database.md`](docs/10-database.md).

Materi Part 2 melengkapi UTS:

- **AWS Architecture Q&amp;A (30 pertanyaan, 6 bagian)** — VPC, IAM, ECS, RDS, server &amp; serverless, cache, antrian, Lambda, CDN, Route 53, Terraform, observability, Well-Architected: [`docs/13-aws-architecture-qanda.md`](docs/13-aws-architecture-qanda.md)
- **Next.js + AI: dari localhost ke production AWS** — arsitektur &amp; AI hybrid (`/api/ai`), roadmap 12 tahap (GitHub → Docker → ECR → EC2 → RDS → Route 53 → ACM/Nginx HTTPS → monitoring → GitHub Actions → optimasi biaya), decision matrix, rollback otomatis, checklist production: [`docs/14-nextjs-ai-production.md`](docs/14-nextjs-ai-production.md)
