# Part 2 — Docker + Nginx

## Kenapa Docker?

Di localhost, aplikasi bergantung pada versi Node, dependency global, dan env mesin. Docker mengemas app + runtime + dependency menjadi image yang sama di laptop, CI, dan EC2.

## Dockerfile yang dipakai

`app/Dockerfile` memakai multi-stage:

1. **deps** — `npm ci` (cache layer).
2. **builder** — `next build` dengan `output: "standalone"`.
3. **runner** — hanya menyalin `.next/standalone`, `.next/static`, dan `public`.

Hasil akhir:

- tidak ada devDependencies,
- berjalan sebagai user `nextjs` (UID 1001),
- `HEALTHCHECK` memanggil `/api/health`,
- image berbasis Alpine.

Cek ukuran:

```bash
docker images ec2-lab
```

## Build & run manual

```bash
cd app
docker build -t ec2-lab .
docker run -d --name app -p 127.0.0.1:3000:3000 \
  -e NEXT_PUBLIC_SITE_URL=https://app.example.com \
  ec2-lab
curl -s localhost:3000/api/health
```

`NEXT_PUBLIC_*` di-inline saat build, jadi harus diberikan sebagai **build arg**, bukan hanya env runtime:

```bash
docker build --build-arg NEXT_PUBLIC_SITE_URL=https://app.example.com -t ec2-lab .
```

## Docker Compose

Tiga service utama + dua opsional lewat profile:

| Service | Fungsi | Port host |
| --- | --- | --- |
| `db` | PostgreSQL 17, volume `db-data` | `127.0.0.1:5433` |
| `app` | Next.js standalone | `127.0.0.1:3000` |
| `nginx` | TLS + reverse proxy | `80`, `443` |
| `adminer` | UI database (`--profile tools`) | `127.0.0.1:8090` |
| `certbot` | renew sertifikat (`--profile tls`) | — |

App dan database hanya bind ke loopback. Artinya health check lokal tetap bisa, tapi internet tidak bisa langsung ke 3000 atau 5432.

```bash
cp .env.example .env
docker compose up -d --build db app
docker compose logs -f app
```

### Service database

```yaml
db:
  image: postgres:17-alpine
  environment:
    POSTGRES_DB: ${POSTGRES_DB:-ec2lab}
    POSTGRES_USER: ${POSTGRES_USER:-ec2lab}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-ec2lab_dev_password}
    PGDATA: /var/lib/postgresql/data/pgdata
  ports:
    - "127.0.0.1:5433:5432"
  volumes:
    - db-data:/var/lib/postgresql/data
    - ./db/init:/docker-entrypoint-initdb.d:ro
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
```

- `app` memakai `depends_on: db: condition: service_healthy`, jadi app tidak start sebelum PostgreSQL siap.
- `DATABASE_URL` di-inject Compose ke app: `postgres://user:pass@db:5432/dbname`.
- `REQUIRE_DB=true` membuat `/api/health` 503 bila database down.
- File di `db/init/` hanya dijalankan saat volume `db-data` pertama kali dibuat.

Detail lengkap: [`10-database.md`](10-database.md).

## Nginx

Template `nginx/templates/default.conf.template` dirender oleh entrypoint image Nginx (`envsubst`), sehingga `DOMAIN` di `.env` otomatis dipakai.

Fitur:

- HTTP → HTTPS 301,
- endpoint ACME `/.well-known/acme-challenge/`,
- proxy ke `app:3000` lewat network Docker,
- header keamanan (nosniff, frame, referrer, permissions, HSTS pendek),
- gzip,
- cache immutable untuk `/_next/static/`,
- health endpoint tanpa access log.

Validasi konfigurasi:

```bash
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
```

## Urutan start yang benar

1. `docker compose up -d db app` — database healthy, lalu app sehat.
2. Terbitkan sertifikat (`scripts/issue-cert.sh`).
3. `docker compose up -d` — nginx + app + db.
4. Smoke test.

Kalau nginx dinyalakan sebelum sertifikat ada, container akan gagal dengan:

```text
[emerg] cannot load certificate ... No such file or directory
```

Itu normal. Terbitkan sertifikat dulu.

## Update & rollback

```bash
APP_IMAGE=ghcr.io/owner/repo:sha-abc1234 bash scripts/deploy.sh
```

Script menyimpan image sebelumnya di `.previous_image`, menunggu health, dan rollback bila perlu.

Manual:

```bash
APP_IMAGE=ghcr.io/owner/repo:sha-lama docker compose up -d --no-deps app
```

## Log & resource

```bash
docker compose ps
docker compose top
docker stats --no-stream
docker compose logs --tail=100 app
```

Rotasi log sudah diatur (`max-size: 10m`, `max-file: 3`), ditambah cron cleanup harian.

## Debug jaringan

```bash
docker network inspect ec2-lab_edge
docker compose exec nginx wget -qO- http://app:3000/api/health
docker compose exec app node -e "fetch('http://db:5432').catch(()=>{})"   # cek DNS db
docker compose exec db pg_isready -U ec2lab -d ec2lab
docker compose exec app sh
```

Kalau `app` sehat dari dalam tapi 502 dari Nginx, biasanya `proxy_pass` salah nama service atau app belum healthy. Kalau app sehat tapi `db.status=down`, cek `DATABASE_URL`, password, dan health container `db`.
