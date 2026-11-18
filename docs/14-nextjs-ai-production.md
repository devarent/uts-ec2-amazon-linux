# 14 — Next.js + AI: Dari `localhost` ke Production AWS (Part 2 — End-to-End)

Dokumen ini menyambungkan [`docs/05-cicd.md`](05-cicd.md) (pipeline),
[`docs/03-domain-https.md`](03-domain-https.md) (DNS+HTTPS), dan
[`docs/08-aws-architecture-notes.md`](08-aws-architecture-notes.md) (teori)
menjadi satu alur utuh: **bagaimana aplikasi Next.js + AI di repo ini naik dari laptop ke production.**

---

## 1. Aplikasi yang di-deploy

```text
User (browser)
   |  https://app.example.com
   v
Nginx (TLS termination :443)
   |  proxy_pass http://app:3000  (Docker network internal)
   v
app (Next.js 16, container non-root, standalone)
   |  /api/health  /api/guestbook  /api/ai  /api/pipeline  /api/deployment
   v
db (PostgreSQL 17, named volume db-data)
```

**AI di aplikasi ini hybrid** (lihat `app/app/api/ai/route.ts`):

| Jalur | Cara kerja | Kapan |
|---|---|---|
| **Local knowledge base** | Pattern matching jawaban dari `lib` knowledge array (12 topik DevOps) | Selalu tersedia, $0, offline |
| **OpenAI chat completions** | `OPENAI_API_KEY` diisi → jawab via `gpt-4o-mini` (timeout 20s) | Opsional, internet tersedia |
| Fallback | Jika OpenAI gagal/tidak ada key → KB lokal | Selalu bekerja, tanpa biaya |

Komponen: `components/chat-widget.tsx` — bubble chat floating di setiap halaman; POST ke `/api/ai` → tampilkan balasan + label sumber (`openai` / `local`).

**Cara mengaktifkan AI generatif:**
```bash
# di .env (EC2) atau environment container
OPENAI_API_KEY=sk-xxx          # atau endpoint yang kompatibel
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```
Verifikasi: `curl -X POST http://127.0.0.1:3000/api/ai -H 'Content-Type: application/json' -d '{"message":"kenapa port 3000 tidak dibuka ke internet?"}'` → harus `source: "openai"`.

> Edukatif: kode sengaja **tidak** menempelkan SDK OpenAI — hanya `fetch` native,
> jadi portabel ke endpoint LLM mana pun yang kompatibel (Azure OpenAI, Ollama, vLLM).

---

## 2. Roadmap: dari `localhost` ke Production

```text
1. Build aplikasi  →  2. Push ke GitHub  →  3. Dockerfile (multi-stage)
→  4. Push image ke ECR/GHCR  →  5. Jalankan di EC2 (Docker + Compose)
→  6. RDS atau Postgres container  →  7. DNS (Route 53 / registrar)
→  8. ACM / Certbot + Nginx (HTTPS)  →  9. CloudWatch / Sentry (monitoring)
→ 10. GitHub Actions (CI/CD + rollback)  → 11. Optimasi biaya & keamanan
```

| Tahap | Tools | Target di repo ini |
|---|---|---|
| Build/lokal | Next.js dev | `npm run dev` → 192.168.100.3:3000 |
| GitHub | git | branch `main`, proteksi branch (opsional) |
| Docker | Multi-stage `app/Dockerfile` | Non-root, healthcheck |
| Registry | GHCR | `ghcr.io/<owner>/<repo>:sha-xxxx` |
| Compute | EC2 t3.micro | `user-data.sh` → Docker + Compose + swap |
| DB | PostgreSQL 17 (container) atau RDS | `docs/10-database.md` / `docs/11-rds-setup.md` |
| DNS | Route 53 A record | `terraform/dns.tf` |
| HTTPS | Certbot + Nginx | `scripts/issue-cert.sh`, `scripts/renew-cert.sh` |
| CI/CD | GitHub Actions | `.github/workflows/deploy-ec2.yml` (health check → auto rollback) |
| Monitoring | CloudWatch + Sentry (opsional) | `/api/health` sebagai probe semua layer |

---

## 3. Keputusan arsitektur (matrix singkat)

| Butuh | Pilihan | Alasan |
|---|---|---|
| Static site murni | S3 + CloudFront | Paling murah; SSG |
| Next.js SSR | EC2/ECS/Fargate | Harus ada compute untuk render on-demand |
| API kecil, traffic sporadis | Lambda + API Gateway | Serverless, cold start mitigasi |
| API utama, traffic stabil | ECS/Fargate + ALB | Bought scale, no cold start |
| DB relasional | RDS PostgreSQL | ACID, backup, Multi-AZ |
| Lookup cepat / session | DynamoDB / ElastiCache Redis | Skala masif, sub-ms write |
| File/user upload | S3 + CloudFront | Murah, global, signed URL |
| Search | OpenSearch | Fuzzy + relevance |

---

## 4. Pipeline CI/CD yang sudah ada di repo

```text
push ke main
   |
   v
.github/workflows/deploy-ec2.yml
   |
   +-- job build:  checkout → buildx → login GHCR → build → push (tag: sha-xxx + latest)
   |
   +-- job deploy: SSH ke EC2 (appleboy/ssh-action) → docker compose pull → up -d
   |              → polling /api/health 30x (interval 2s)
   |              → gagal? → compose down + image tag sebelumnya → exit 1 (ROLLBACK)
   |
   +-- job smoke:  curl health + guestbook CRUD
```

**Rollback manual jika dibutuhkan:**
```bash
ssh admin@IP-EC2
cd /opt/ec2-lab
IMAGE_TAG=sha-abc1234 docker compose up -d
curl -f http://127.0.0.1:3000/api/health
```

---

## 5. DNS &amp; HTTPS

```bash
# A record → Elastic IP (Route 53: terraform/dns.tf)
# Sertifikat (Certbot standalone):
DOMAIN=app.example.com EMAIL=kamu@example.com sudo -E bash scripts/issue-cert.sh
# Nginx me-redirect 80 -> 443, fullchain.pem dari /etc/letsencrypt/live/<domain>/
# Renewal otomatis via cron 02:30 & 14:30 (dikonfigurasi setup-ec2.sh)
curl -I https://app.example.com          # harus 200/301, valid cert
openssl s_client -connect app.example.com:443 -servername app.example.com </dev/null 2>/dev/null | openssl x509 -noout -dates
```

---

## 6. Checklist production sebelum "go live"

- [ ] `terraform plan` bersih; `terraform.tfstate` di-backup; state di luar laptop
- [ ] Security Group: hanya 22 (IP kamu) + 80 + 443; **3000 &amp; 5432 tidak dibuka**
- [ ] Timing: **Password/token diganti** (`.env.example` kosong ≠ production)
- [ ] Backup DB terjadwal + `restore-db.sh` sudah diuji sekali
- [ ] Budgets AWS ($1 &amp; $5) + tagging + `terraform destroy` disiapkan
- [ ] Health check `/api/health` mengembalikan `db.status: up`
- [ ] Rollback di CI/CD terbukti (coba sengaja gagalkan build smoke)
- [ ] HTTPS valid: cert tidak expired, HTTP redirect ke HTTPS

---

## 7. Biaya (estimasi Free Tier)

| Resource | 12 bulan pertama | Keterangan |
|---|---|---|
| EC2 t3.micro | Gratis (750 jam) | ±$7,60/bln setelah itu |
| EBS 30 GB gp3 | Gratis | Lebih = $0,08/GB-bln |
| Public IPv4 | $3,6/bulan sejak 2024 | **Pelepasan setelah demo** (`terraform destroy`) |
| Elastic IP idle | $3,6/bulan | Lepaskan (release) saat selesai! |
| RDS t4g.micro | Gratis (750 jam) | 20 GB storage |
| NAT Gateway | $33/bulan ⚠️ | Hindari di lab; gunakan public instance |

---

## 8. Verifikasi akhir (simpan di notes)

```bash
# lokal
curl -s http://192.168.100.3:3000/api/health

# dari EC2
ssh admin@IP-EC2 'curl -s 127.0.0.1:3000/api/health'

# publik
curl -sL https://app.example.com/api/health
curl -s https://app.example.com/api/guestbook
curl -s -X POST https://app.example.com/api/ai \
     -H "Content-Type: application/json" \
     -d '{"message":"sistem backup di lab ini kapan berjalan?"}'
```

Balasan benar membuktikan **semua lapisan** (DNS, TLS, Nginx, app, DB, AI) berfungsi.
