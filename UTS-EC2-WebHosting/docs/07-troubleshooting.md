# Troubleshooting

## 1. Tidak bisa SSH

Gejala: `Connection timed out` / `Connection refused`.

```bash
# dari laptop
ping <elastic-ip>
nc -vz <elastic-ip> 22        # macOS/Linux
Test-NetConnection <ip> -Port 22   # Windows PowerShell
```

Cek berurutan:

1. Instance **running** dan status check 3/3.
2. Security group punya rule 22 dari **IP saat ini** (`curl ifconfig.me`).
3. Network ACL tidak memblokir (default allow).
4. Instance punya public IP / EIP.
5. ufw di host: `sudo ufw status`.
6. User benar: Debian `admin`, Ubuntu `ubuntu`.

Jika baru mengubah SG, tunggu beberapa detik. Jika IP publik berubah, gunakan EIP.

## 2. `Permission denied (publickey)`

```bash
chmod 400 awskeypair.pem
ssh -i awskeypair.pem admin@<ip> -v
```

- Key harus pasangan key pair instance (bukan key lain).
- Format harus OpenSSH/PEM, bukan `.ppk` (konversi: `puttygen key.ppk -O private-openssh -o key.pem`).
- Coba user lain bila AMI berbeda.
- Jika key hilang: buat key baru, lampirkan lewat **Actions → Security → Modify IAM role?** Tidak — key pair tidak bisa diganti tanpa stop instance; gunakan EC2 Instance Connect atau SSM untuk menambahkan public key ke `~/.ssh/authorized_keys`.

## 3. Docker tidak bisa diakses tanpa sudo

```bash
sudo usermod -aG docker "$USER"
newgrp docker        # atau logout/login
docker ps
```

## 4. Container app restart loop

```bash
docker compose ps
docker compose logs --tail=100 app
docker inspect ec2-lab-app --format '{{.State.ExitCode}}'
```

Penyebab umum:

- `PORT`/`HOSTNAME` salah,
- `NEXT_PUBLIC_SITE_URL` tidak valid (build ulang jika berubah),
- file `.next/standalone/server.js` tidak ada (build tidak standalone),
- permission volume,
- database belum healthy sehingga `depends_on` menahan app.

Uji image langsung:

```bash
docker run --rm -p 3000:3000 ec2-lab:test
```

## 5. Nginx 502 Bad Gateway

```bash
docker compose ps
docker compose exec nginx wget -qO- http://app:3000/api/health
docker compose logs nginx
```

- `app` belum healthy → `depends_on` menahan nginx,
- nama service berubah → sesuaikan `upstream`,
- app crash karena env hilang → cek `.env`.

## 6. Nginx gagal start: certificate not found

```text
[emerg] cannot load certificate "/etc/letsencrypt/live/app.example.com/fullchain.pem"
```

Sertifikat belum ada atau `DOMAIN` tidak cocok. Terbitkan dulu:

```bash
DOMAIN=app.example.com EMAIL=kamu@email.com sudo -E bash scripts/issue-cert.sh
```

Cek:

```bash
ls -l nginx/certs/live/
docker compose exec nginx env | grep DOMAIN
```

## 7. Certbot gagal

| Error | Solusi |
| --- | --- |
| `Timeout during connect (port 80)` | SG/ufw 80, nginx masih memakai 80, DNS salah |
| `DNS problem: NXDOMAIN` | A record belum ada / propagasi |
| `too many failed authorizations` | tunggu 1 jam, gunakan staging untuk uji |
| `unauthorized` | domain tidak cocok dengan yang diminta |

Uji staging (tidak membebani rate limit):

```bash
docker run --rm -p 80:80 -v "$PWD/nginx/certs:/etc/letsencrypt" \
  certbot/certbot certonly --standalone --staging \
  -d app.example.com --email kamu@email.com --agree-tos --non-interactive
```

## 8. Domain tidak mengarah ke server

```bash
dig +short app.example.com
dig +short NS example.com
whois example.com | head
```

- A record harus Elastic IP.
- Jika Cloudflare, matikan proxy dulu (grey cloud) saat issuance.
- TTL 300–3600; tunggu sesuai TTL.

## 9. Pipeline gagal di health check

```bash
# di EC2
cd /opt/app
docker compose ps
docker compose logs --tail=100 db
curl -v http://127.0.0.1:3000/api/health
docker compose logs --tail=100 app
docker inspect --format '{{.Config.Image}}' ec2-lab-app
```

Jika response menunjukkan `"db":{"status":"down"}`, lihat bagian database di bawah. Rollback manual:

```bash
cat .previous_image
APP_IMAGE=$(cat .previous_image) docker compose up -d --no-deps app
```

## 10. GHCR `denied` / `manifest unknown`

```bash
docker login ghcr.io -u <user>
docker manifest inspect ghcr.io/owner/repo:sha-abc1234
```

- Package private → butuh token `read:packages`.
- Tag salah → cek tab **Packages** di GitHub.
- Workflow di repo berbeda → `GITHUB_TOKEN` tidak punya akses.

## 11. Disk penuh

```bash
df -h /
docker system df
sudo /usr/local/bin/docker-cleanup
journalctl --vacuum-size=200M
```

Penyebab: image lama, build cache, log tanpa rotasi.

## 12. RAM habis (t3.micro)

```bash
free -h
dmesg | grep -i oom
docker stats --no-stream
```

- Pastikan swap aktif (`swapon --show`).
- Build di CI, bukan di EC2.
- Batasi container (`deploy.resources.limits`).
- Naik ke `t3.small` bila perlu.

## 13. `terraform init` gagal download provider

Gejala: `Failed to install provider ... releases.hashicorp.com`.

- Coba jaringan lain / matikan IPv6 sementara.
- Set mirror:

```bash
export TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
mkdir -p "$TF_PLUGIN_CACHE_DIR"
terraform init
```

- Atau unduh manual ke `%APPDATA%\terraform.d\plugins\registry.terraform.io\hashicorp\aws\<versi>\windows_amd64`.

## 14. K8s: Pod `CrashLoopBackOff`

```bash
kubectl describe pod -n ec2-lab <pod>
kubectl logs -n ec2-lab <pod> --previous
kubectl get events -n ec2-lab --sort-by=.lastTimestamp
```

Umum: image pull secret belum ada, env secret hilang, read-only FS tapi butuh tulis di path lain.

## 15. Database PostgreSQL

Gejala: `/api/health` mengembalikan 503 dengan `"db":{"status":"down"}`, atau guestbook error `database_unavailable`.

```bash
cd /opt/app
docker compose ps
docker compose logs --tail=100 db
docker inspect --format '{{.State.Health.Status}}' ec2-lab-db
docker compose exec db pg_isready -U ec2lab -d ec2lab
docker compose exec app printenv DATABASE_URL
```

| Gejala | Solusi |
| --- | --- |
| `db` tidak healthy | tunggu `start_period`, cek RAM/disk, lihat log |
| `password authentication failed` | password berubah setelah volume dibuat; samakan `.env` atau reset volume |
| `database_not_configured` | `DATABASE_URL` kosong di container app |
| `port is already allocated` | port host 5433/8090 dipakai; ubah mapping kiri |
| Guestbook kosong | cek `SELECT count(*)`; pastikan tidak menjalankan `down -v` |
| Data hilang setelah recreate | volume terhapus; restore dari `backups/` |

Saat volume sudah pernah dibuat, mengubah `POSTGRES_PASSWORD` di `.env` **tidak** mengubah password di dalam database. Untuk lab, reset:

```bash
docker compose down -v        # DATA HILANG
docker compose up -d db app
```

Untuk data yang harus dipertahankan, restore dump setelah reset. Panduan lengkap: [`10-database.md`](10-database.md).

## 16. Kumpulan perintah debug

```bash
# host
sudo ss -tulpn
sudo journalctl -u docker --since "10 min ago"
curl -I http://127.0.0.1

# docker
docker compose config
docker compose ps -a
docker compose logs -f --tail=50
docker stats --no-stream
docker compose exec db pg_isready -U ec2lab -d ec2lab
docker compose exec -T db psql -U ec2lab -d ec2lab -c 'SELECT count(*) FROM guestbook;'

# nginx
docker compose exec nginx nginx -t
docker compose exec nginx cat /etc/nginx/conf.d/default.conf

# TLS
openssl s_client -connect app.example.com:443 -servername app.example.com </dev/null 2>/dev/null | openssl x509 -noout -dates
```
