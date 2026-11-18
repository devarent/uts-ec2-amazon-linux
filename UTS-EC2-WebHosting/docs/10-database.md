# UTS0 — Database PostgreSQL di dalam EC2

Default lab memakai **PostgreSQL 17 di EC2** agar self-contained. Terraform juga menyediakan opsi **AWS RDS PostgreSQL** di subnet privat untuk deployment terkelola.

> Pada mode default, app + database + volume + backup + tools admin ada di EC2. Dengan RDS, database berada di subnet privat. Port database tidak terbuka ke internet.

---

## 1. Arsitektur

```text
Internet
  │  https://app.example.com
  ▼
Nginx :443  ── redirect :80, ACME, TLS
  │  Docker network `edge`
  └──────────────► Next.js app :3000
                      │  Docker network `data` (internal)
                      ├────────────► PostgreSQL 17 :5432
                      │                 └── volume `db-data`
                      └────────────► Adminer :8080 (profil tools)
```

Hal penting:

- `app` terhubung ke network `edge` dan `data`; PostgreSQL hanya terhubung ke
  network internal `data`.
- Host hanya memetakan `127.0.0.1:5433 -> db:5432` (loopback). Port ini **tidak** dibuka di Security Group.
- `nginx` hanya bicara ke `app`, tidak pernah langsung ke `db`.
- Data berada di named volume `db-data`, jadi tetap ada saat container app di-recreate.

## Konfigurasi database di workspace

Dashboard memiliki Database workspace dengan pencarian layanan PostgreSQL,
MySQL/MariaDB, SQL Server, Oracle, Aurora, Redshift Serverless, DocumentDB,
Neptune, ElastiCache, dan OpenSearch. Endpoint eksternal dapat dicatat sebagai
`localhost`, IPv4, DNS, atau hostname service Docker. Nilai ini hanya disimpan
sebagai metadata per akun; aplikasi tidak menghubungi endpoint, menyimpan
credential, mengubah `DATABASE_URL`, atau membuat resource AWS. Public access
tetap dinonaktifkan. Dari container, `localhost` merujuk ke container app;
gunakan hostname yang dapat dijangkau dari jaringan container.

Konfigurasi EC2 juga menyediakan pencarian Quick Start OS, AMI ID, region,
arsitektur, username, key pair, jumlah instance, tags, ringkasan launch, serta
editor inbound rules. Daftar AMI adalah referensi lokal dan bukan hasil AWS API;
verifikasi AMI ID untuk region/arsitektur sebelum dipakai. Port 22 dibatasi ke
CIDR admin `/32`; port 3000 dan database tidak diizinkan terbuka publik.

---

## 2. File dan komponen

| File | Fungsi |
| --- | --- |
| `docker-compose.yml` | service `db`, `app`, `adminer`, volume `db-data` |
| `docker-compose.rds.yml` | menonaktifkan container PostgreSQL lokal untuk mode RDS |
| `db/init/001-schema.sql` | schema awal, dijalankan image PostgreSQL saat volume kosong |
| `app/lib/db.ts` | pool `pg`, schema idempoten, auth, sesi, progres konfigurasi, guestbook, health |
| `app/lib/auth.ts` | password scrypt dan sesi token opaque |
| `app/lib/lab.ts` | sembilan tahap dan pilihan konfigurasi |
| `app/app/api/guestbook/route.ts` | endpoint `GET` / `POST` / `DELETE` |
| `app/app/api/auth/` | register, login, logout, dan sesi pengguna |
| `app/app/api/deployment/route.ts` | baca/simpan checklist per pengguna |
| `app/app/api/pipeline/route.ts` | baca/simpan konfigurasi action CodePipeline per pengguna |
| `app/lib/pipeline.ts` | default dan validasi konfigurasi Source/Build/Deploy |
| `app/components/pipeline-configurator.tsx` | formulir dashboard Source, CodeBuild, CodeDeploy |
| `app/app/api/database-config/route.ts` | baca/simpan konfigurasi database per pengguna |
| `app/lib/database-config.ts` | default, jenis provider, dan validasi konfigurasi database |
| `app/components/database-workspace.tsx` | formulir database, kapasitas, jaringan, keamanan, dan backup |
| `app/lib/section-config.ts` | definisi field, nilai awal, dan validasi konfigurasi 9 tahap |
| `app/components/guestbook.tsx` | UI guestbook (client component) |
| `app/app/api/health/route.ts` | health app + status database |
| `scripts/backup-db.sh` | `pg_dump` + retensi |
| `scripts/restore-db.sh` | `pg_restore` + konfirmasi |
| `.env.example` | kredensial dan token |

---

## 3. Environment variable

### Root `.env` (Docker Compose)

```dotenv
POSTGRES_DB=ec2lab
POSTGRES_USER=ec2lab
POSTGRES_PASSWORD=ganti-password-kuat
ADMIN_TOKEN=ganti-token-admin-acak
```

| Variable | Dipakai oleh | Catatan |
| --- | --- | --- |
| `POSTGRES_DB` | container `db` + `DATABASE_URL` | nama database |
| `POSTGRES_USER` | container `db` + `DATABASE_URL` | user database |
| `POSTGRES_PASSWORD` | container `db` + `DATABASE_URL` | **URL-safe**: huruf, angka, `-`, `_` |
| `DATABASE_URL` | app | kosong/tidak diset = Compose PostgreSQL; isi = database eksternal seperti RDS |
| `DATABASE_SSL` | app | set `true` untuk koneksi TLS ke RDS |
| `ADMIN_TOKEN` | route `DELETE /api/guestbook` | kosong = delete dinonaktifkan |

Jika `DATABASE_URL` kosong, Compose menyusun URL lokal:

```text
DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
```

Jika password mengandung karakter khusus (`@`, `:`, `/`, `#`), set `DATABASE_URL` manual di `.env` dan URL-encode password-nya.

### Menggunakan AWS RDS

Terraform membuat RDS hanya ketika `rds_master_password` diisi. Database berada di
subnet privat tanpa public IP; security group hanya mengizinkan PostgreSQL dari
security group EC2. Ini menghindari membuka port 5432 ke internet.

1. Salin `terraform/terraform.tfvars.example` ke `terraform/terraform.tfvars`,
   aktifkan nilai RDS yang diperlukan, lalu set password secara out-of-band:

   ```bash
   export TF_VAR_rds_master_password='password-kuat-url-safe'
   cd terraform
   terraform plan
   terraform apply
   terraform output -raw rds_address
   ```

   Untuk PowerShell, gunakan `$env:TF_VAR_rds_master_password = 'password-kuat-url-safe'`.
   Jangan masukkan password ke Git atau log terminal.
2. Di `/opt/app/.env` pada EC2, isi endpoint dan kredensial database:

   Format URL lengkapnya adalah
   `postgres://<user>:<password>@<rds-address>:5432/<database>`. Contoh:

   ```dotenv
   DATABASE_URL=postgres://ec2lab_admin:password-kuat-url-safe@db.example.ap-southeast-3.rds.amazonaws.com:5432/ec2lab
   DATABASE_SSL=true
   ```

3. Restart app dan cek `/api/health`; pastikan `db.status` bernilai `up`.

Jalankan app tanpa container DB lokal menggunakan override:

```bash
docker compose -f docker-compose.yml -f docker-compose.rds.yml up -d app
```

Compose menghormati `DATABASE_URL` bila diisi. RDS tetap mengeluarkan biaya saat hidup; tinjau
biaya instance/storage/backup dan deletion protection sebelum `terraform apply`
atau destroy. Jangan pernah mengatur ingress RDS ke `0.0.0.0/0`.

### App (`app/.env` untuk `npm run dev`)

```dotenv
DATABASE_URL=postgres://ec2lab:<password>@127.0.0.1:5433/ec2lab
REQUIRE_DB=false
ADMIN_TOKEN=ganti-token-admin-acak
```

| Variable | Fungsi |
| --- | --- |
| `DATABASE_URL` | koneksi pool `pg`; tanpa ini endpoint DB mengembalikan `503 database_not_configured` |
| `DATABASE_SSL=true` | aktifkan TLS (dipakai bila database eksternal seperti RDS) |
| `DB_POOL_MAX` | jumlah koneksi maksimum pool (default `5`) |
| `REQUIRE_DB=true` | `/api/health` mengembalikan **503** bila DB down |
| `ADMIN_TOKEN` | token header `x-admin-token` untuk delete |

> Saat build (`next build`), pool tidak dibuat. Koneksi baru terjadi saat request runtime, sehingga CI bisa build tanpa database.

---

## 4. Schema

`db/init/001-schema.sql` membuat tabel Guestbook, akun, sesi, progres, dan
konfigurasi pipeline/database:

```sql
CREATE TABLE IF NOT EXISTS guestbook (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  message VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS guestbook_created_at_idx
  ON guestbook (created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deployment_progress (
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  step_id SMALLINT NOT NULL CHECK (step_id BETWEEN 1 AND 9),
  selected_option_id VARCHAR(80) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, step_id)
);

CREATE TABLE IF NOT EXISTS pipeline_configurations (
  user_id BIGINT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  configuration JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS database_configurations (
  user_id BIGINT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  configuration JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_section_configurations (
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  step_id SMALLINT NOT NULL CHECK (step_id BETWEEN 1 AND 9),
  configuration JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, step_id)
);
```

Catatan:

- File di `db/init/` **hanya dijalankan sekali**, saat volume `db-data` masih kosong.
- `app/lib/db.ts` juga menjalankan schema idempoten saat runtime. Upgrade volume lama dan RDS tidak perlu dihapus; tabel baru dibuat saat aplikasi mengakses database.
- Password akun di-hash dengan `scrypt`; database menyimpan hash token sesi, bukan token cookie mentah.
- Setiap akun memiliki pilihan konfigurasi dan status checklist untuk tiap tahap; perubahan hanya milik akun tersebut.
- `pipeline_configurations.configuration` menyimpan metadata Source/Build/Deploy dalam JSONB per akun. Credential, access key, token, dan nilai secret tidak disimpan; kelola melalui AWS Connections/IAM/Secrets Manager.
- `database_configurations.configuration` menyimpan pilihan provider, region, engine, kapasitas, storage, jaringan, keamanan, dan backup per akun. API menolak konfigurasi yang meminta akses publik; password dan URL koneksi tidak disimpan.
- `deployment_progress` menyimpan pilihan checklist dan verifikasi untuk tiap tahap. `lab_section_configurations` menyimpan field detail tiap tahap sebagai JSONB, dengan satu baris per pengguna dan tahap (1–9). Tahap 04 disinkronkan dengan konfigurasi database khusus. Ini satu database PostgreSQL aplikasi, bukan sembilan database AWS terpisah.
- Detail per tahap mencakup region/instance/key pair/volume untuk EC2; metode admin, CIDR, dan aturan port untuk network; OS, Docker, swap, dan direktori untuk Linux; proxy/TLS/domain untuk Nginx; DNS/EIP/TTL; tool/state backend/workspace untuk IaC; platform/repository/branch/registry/health check untuk CI/CD; serta platform/Helm/replica/autoscaling untuk Kubernetes.
- Pilihan tahap 04 mengikuti provider database yang disimpan, termasuk PostgreSQL Docker, RDS, Aurora, dan Redshift Serverless; label checklist tidak menyamarkan engine lain sebagai PostgreSQL.
- Formulir checklist, CodePipeline, dan Database hanya menyimpan konfigurasi. Tidak ada AWS API, Terraform plan/apply, atau perubahan resource yang dijalankan oleh aplikasi. Akses database publik dan port publik aplikasi tetap dinonaktifkan.
- Urutan data: terbaru dulu (`created_at DESC, id DESC`).

---

## 5. Menjalankan lokal

### 5.1 App + database lewat Compose

```bash
cp .env.example .env
# edit POSTGRES_PASSWORD dan ADMIN_TOKEN
docker compose up -d db app
docker compose ps
curl -s localhost:3000/api/health
```

Health yang benar:

```json
{"status":"ok","db":{"status":"up","latency_ms":5}}
```

Buka <http://localhost:3000> lalu tulis pesan di Guestbook.

### 5.2 Mode development (`npm run dev`)

```bash
docker compose up -d db
cd app
cp .env.example .env
# DATABASE_URL memakai 127.0.0.1:5433
npm ci
npm run dev
```

### 5.3 Masuk ke psql

```bash
docker compose exec db psql -U ec2lab -d ec2lab
```

Contoh query:

```sql
\dt
SELECT id, name, message, created_at FROM guestbook ORDER BY created_at DESC LIMIT 10;
DELETE FROM guestbook WHERE id = 1;
```

Atau satu perintah:

```bash
docker compose exec -T db psql -U ec2lab -d ec2lab -c 'SELECT count(*) FROM guestbook;'
```

### 5.4 Adminer

Adminer hanya bind ke loopback supaya tidak terbuka ke internet.

```bash
# di EC2
cd /opt/app
docker compose --profile tools up -d adminer
```

Dari laptop:

```bash
ssh -L 8090:127.0.0.1:8090 admin@<ELASTIC_IP>
```

Buka <http://localhost:8090>, lalu isi:

| Field | Nilai |
| --- | --- |
| System | PostgreSQL |
| Server | `db` |
| Username | `ec2lab` (atau `POSTGRES_USER`) |
| Password | dari `.env` |
| Database | `ec2lab` (atau `POSTGRES_DB`) |

Matikan lagi bila tidak dipakai:

```bash
docker compose --profile tools stop adminer
```

---

## 6. API guestbook

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/api/guestbook` | daftar maksimal 50 pesan terbaru |
| `POST` | `/api/guestbook` | buat pesan (`name`, `message`) |
| `DELETE` | `/api/guestbook?id=<id>` | hapus, butuh header `x-admin-token` |

Contoh:

```bash
curl -s https://app.example.com/api/guestbook

curl -s -X POST https://app.example.com/api/guestbook \
  -H 'Content-Type: application/json' \
  -d '{"name":"Arya","message":"Halo dari EC2"}'

curl -s -X DELETE \
  -H "x-admin-token: $ADMIN_TOKEN" \
  "https://app.example.com/api/guestbook?id=1"
```

Status penting:

| Status | Arti |
| --- | --- |
| `201` | pesan dibuat |
| `200` | daftar / delete sukses |
| `400` | input tidak valid (`name_too_short`, `message_too_short`, `invalid_id`) |
| `401` | token admin salah / kosong |
| `404` | id tidak ditemukan |
| `503` | database belum dikonfigurasi atau tidak tersedia |

## 7. Konfigurasi AWS CodePipeline

Dashboard menyediakan form lebar bergaya AWS Console untuk tiga action:

1. **Source** — action name, provider Bitbucket/GitHub, connection, repository,
   branch, format artifact (CodePipeline default/full clone), namespace, dan
   daftar output artifacts.
2. **Build** — action name, region, input artifacts, CodeBuild project,
   buildspec override, daftar environment variable (key/value/type), mode
   single/batch, namespace, dan output artifacts.
3. **Deploy** — action name, region, input artifacts, CodeDeploy application,
   deployment group, dan namespace.

Gunakan **Simpan konfigurasi** untuk menyimpan perubahan ke PostgreSQL.
Formulir ini tidak membuat atau menjalankan pipeline. Buat koneksi dan resource
AWS di akun Anda, simpan nilai rahasia di AWS, lalu tinjau permission dan biaya
sebelum menjalankan deployment.

Validasi: nama 2–80 karakter, pesan 3–500 karakter (di-trim lebih dulu).

---

## 8. Backup & restore

### 7.1 Backup otomatis

`scripts/setup-ec2.sh` memasang cron:

```cron
30 3 * * * root cd /opt/app && APP_DIR=/opt/app /usr/local/bin/backup-db >> /var/log/db-backup.log 2>&1
```

Script `scripts/backup-db.sh`:

1. `pg_dump --format=custom --no-owner --no-acl`,
2. menyimpan ke `backups/ec2lab-<UTC>.dump`,
3. `chmod 600`,
4. menyesuaikan owner dengan direktori app agar bisa di-`scp`,
5. menghapus dump lebih lama dari `KEEP_DAYS` (default 7 hari).

Backup manual:

```bash
cd /opt/app
APP_DIR=/opt/app bash scripts/backup-db.sh
ls -lh backups/
```

Cek log cron:

```bash
tail -n 50 /var/log/db-backup.log
```

### 7.2 Simpan salinan di luar EC2

Volume EC2 bisa hilang. Salin dump keluar secara berkala:

```bash
scp admin@<ELASTIC_IP>:/opt/app/backups/*.dump ./backup-ec2/
```

Untuk produksi, gunakan object storage (S3) + lifecycle policy, dan enkripsi.

### 7.3 Restore

```bash
cd /opt/app
bash scripts/restore-db.sh backups/ec2lab-20260101T033000Z.dump
```

Script akan meminta konfirmasi karena data saat ini ditimpa. Proses memakai `--clean --if-exists --single-transaction`.

Restore manual tanpa script:

```bash
docker compose exec -T db sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-acl' \
  < backups/ec2lab-20260101T033000Z.dump
```

Setelah restore, cek:

```bash
curl -s https://app.example.com/api/guestbook
```

### 7.4 Uji backup itu wajib

Backup yang belum pernah direstore belum bisa dipercaya. Minimal sebulan sekali:

1. Ambil satu dump.
2. Restore ke database sementara (container `postgres` lain).
3. Bandingkan jumlah baris.
4. Hapus container sementara.

---

## 9. Migrasi schema

Untuk UTS, schema cukup dibuat idempoten. Saat aplikasi berkembang:

1. Buat folder `db/migrations/`.
2. Tambahkan file bernomor, misal `002-add-email.sql`.
3. Terapkan dengan urutan nama file.
4. Catat migrasi yang sudah jalan di tabel `schema_migrations`.

Contoh alur manual:

```bash
for f in db/migrations/*.sql; do
  echo "==> $f"
  docker compose exec -T db psql -U ec2lab -d ec2lab -v ON_ERROR_STOP=1 < "$f"
done
```

Alternatif tool: Prisma Migrate, Drizzle Kit, `node-pg-migrate`, atau Flyway. Jangan mengandalkan `db/init/` untuk perubahan schema pada database yang sudah berjalan.

---

## 10. Keamanan

- Database **tidak** diekspos ke internet. Security Group hanya 22, 80, 443.
- Mapping host `127.0.0.1:5433` hanya untuk loopback.
- `POSTGRES_PASSWORD` dan `ADMIN_TOKEN` tidak di-commit; `.env` di-`chmod 600`.
- Container memakai `no-new-privileges:true`.
- App berjalan non-root (UID 1001).
- Untuk produksi serius: pindahkan DB ke private subnet/RDS, aktifkan TLS, gunakan Secrets Manager, dan rotasi kredensial.

---

## 11. Operasional

```bash
# status & health
docker compose ps
docker inspect --format '{{.State.Health.Status}}' ec2-lab-db

# log
docker compose logs -f --tail=100 db

# ukuran data
docker system df -v | grep db-data
docker compose exec -T db psql -U ec2lab -d ec2lab -c "SELECT pg_size_pretty(pg_database_size('ec2lab'));"

# restart tanpa kehilangan data
docker compose restart db
```

`restart` dan `up -d` aman: volume tetap. Yang menghapus data hanya `docker compose down -v` atau `docker volume rm ec2-lab_db-data`.

---

## 12. Troubleshooting database

| Gejala | Penyebab / solusi |
| --- | --- |
| `/api/health` 503, `db.status=down` | DB belum siap / password salah. `docker compose ps db`, `logs db` |
| `database_not_configured` | `DATABASE_URL` tidak ada di environment app |
| `password authentication failed` | `POSTGRES_PASSWORD` berubah setelah volume dibuat. Password lama tersimpan di volume; samakan atau reset volume |
| App restart loop menunggu DB | `depends_on` menunggu `service_healthy`; cek `pg_isready` dan RAM |
| Guestbook kosong setelah deploy | wajar bila volume baru; jangan pakai `down -v` |
| Adminer connection refused | bind loopback; pakai SSH tunnel, jangan buka port ke publik |
| `port is already allocated` saat `up` | port host 5433/8090 bentrok; ubah mapping kiri |
| Disk penuh | dump menumpuk / log; cek retensi dan `docker system df` |

### Reset database (data hilang)

```bash
docker compose down -v
docker compose up -d db app
```

Gunakan hanya saat latihan atau setelah backup.

---

## 13. Kapan pindah ke RDS?

Tetap pakai PostgreSQL di EC2 bila:

- ini lab/UTS dan kamu ingin satu stack sederhana,
- trafik kecil dan downtime singkat masih bisa ditoleransi,
- kamu nyaman mengurus backup + upgrade sendiri.

Pindah ke RDS/Aurora bila:

- butuh Multi-AZ, automated backup + point-in-time recovery,
- butuh scaling storage/IO tanpa mengurus VM,
- ada kepatuhan/audit dan pemisahan database dari app server,
- ingin mengurangi beban operasional.

Jika pindah, app tidak perlu diubah banyak: cukup arahkan `DATABASE_URL` ke endpoint RDS, set `DATABASE_SSL=true`, dan hapus service `db` dari Compose (atau biarkan dengan profil). Schema tetap dibuat oleh `app/lib/db.ts` atau migrasi.

---

## 14. Checklist database

- [ ] `.env` berisi `POSTGRES_*` yang kuat dan `ADMIN_TOKEN`
- [ ] `docker compose up -d db app` sukses
- [ ] `/api/health` 200 dengan `db.status = up`
- [ ] Guestbook bisa POST dan GET
- [ ] Data bertahan setelah `docker compose restart`
- [ ] Backup manual menghasilkan file di `backups/`
- [ ] Restore diuji dan data kembali
- [ ] Cron backup terpasang (`/etc/cron.d/db-backup`)
- [ ] Port 5432/5433 tidak terbuka di Security Group
- [ ] Adminer hanya diakses lewat SSH tunnel
