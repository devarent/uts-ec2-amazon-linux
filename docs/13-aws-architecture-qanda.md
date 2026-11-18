# 13 — AWS Architecture Q&amp;A (Part 2 — Materi Teori Production)

Ringkasan 30 pertanyaan arsitektur AWS yang paling sering ditanyakan di interview dan
implementasi nyata — dikelompokkan ke 6 bagian. Dokumen ini adalah pasangan dari
[`docs/08-aws-architecture-notes.md`](08-aws-architecture-notes.md) (catatan teori) dan
[`docs/12-references.md`](12-references.md) (sumber artikel).

> Prinsip umum: **didesain untuk production**, bukan untuk click-testing di konsol.
> Setiap keputusan punya alasan (cost, security, operability, scalability).

---

## Part 1 — Network &amp; Security Architecture

### 1. Environment secrets di Dev vs Production
Jangan ikut-ikutan `.env` di produksi. Gunakan **SSM Parameter Store** (gratis, cocok untuk non-critical)
atau **Secrets Manager** (rotasi otomatis, lebih mahal). Untuk container (ECS), secret diinjeksikan
lewat `secrets` pada task definition — kode aplikasi cukup baca `process.env.DB_PASSWORD`, tanpa
SDK AWS di business logic. Tim di awali: `aws ssm put-parameter --type SecureString`.
**Analogi:** keycard hotel, bukan kunci kamar yang dihafal tamu.

### 2. VPC isolation &amp; network security
Backend (ECS/EC2) dan database (RDS) wajib di **private subnet** — tanpa public IP mereka
**secara matematis** tidak bisa dijangkau dari internet. Hanya 80/443 publik (ALB atau Nginx)
yang mendapat public IP; lalu lintas masuk hanya lewat API Gateway/ALB sebagai pintu depan.

### 3. Public access vs Private VPC boundary
Endpoint API publik ≠ server-nya terbuka (Chrome DevTools hanya melihat request sampai ke
API Gateway, bukan isi dapurnya). Gateway menanggapi, memvalidasi token, lalu meneruskan ke
VPC; jawaban kembali lewat jalur yang sama. **Boundary Ingress ≠ Endpoint Public.**

### 4. IAM Role vs IAM Policy
**Policy** = dokumen izin (apa boleh/tidak, JSON). **Role** = "topi"/identitas sementara yang
dirasuk penyedia layanan untuk mendapatkan credentials berputar. Jangan gunakan access key permanen di dalam image;
pakai **instance profile** (EC2/ECS) dengan least-privilege.
**Analogi:** Policy = backstage pass; Role = lanyard yang memegang pass.

### 5. Cognito User Pools vs Identity Pools
**User Pool** = database user (signup, password reset, MFA, federasi Google/Apple), mengeluarkan JWT.
**Identity Pool** = penukar JWT → temporary AWS credentials (akses langsung ke S3/DynamoDB).
Login pakai User Pool; akses langsung ke resource pakai Identity Pool.

### 6. AWS WAF &amp; Shield
**WAF** = inspeksi request HTTP (SQLi, XSS, botnet, geo blocking) di depan CloudFront/ALB/API Gateway.
**Shield** = perlindungan DDoS di layer network (Shield Standard otomatis; Advanced berbayar).
WAF = penjaga pintu yang memeriksa tas; Shield = polisi anti-kerusuhan di luar stadion.

### 7. AWS KMS (Encryption at Rest)
Data fisik di disk di-scrambling otomatis. RDS/S3/EBS/Secrets Manager memakai KMS untuk
meng-generate &amp; menyimpan kunci; aplikasi tidak perlu menulis kode enkripsi.
**Catatan biaya:** KMS key $1/bulan per key; decrypt call di-charge per 10k request.

---

## Part 2 — Compute &amp; Microservices

### 8. ECS, EC2, VPC, Serverless — definisinya
- **VPC** = tanah privat tempat membangun rumah.
- **EC2** = VM tradisional (kamu yang patch OS-nya).
- **ECS** = orkestrator container (jalankan, sehatkan, scale container).
- **Fargate** = ECS tanpa mengelola server (serverless compute; bayar per vCPU-detik).
**Rule of thumb:** butuh kontrol penuh + stateful → EC2; butuh managed → Fargate; function sporadis → Lambda.

### 9. Public vs Protected routes di API Gateway
Gateway melakukan otorisasi **per route**: `GET /products` → `Authorization: NONE` (publik),
`POST /orders` → Cognito Authorizer. Token diverifikasi di edge; request invalid dipotong
sebelum menyentuh VPC (401/403). **Di sinilah Auth-nya seharusnya berada, bukan di tiap service.**

### 10. API Gateway vs Application Load Balancer (ALB)
**API Gateway** = edge guard: validasi token, quota/usage plan, rate limit, API key — di internet publik.
**ALB** = traffic cop internal: health check target group, distribusi merata, rolling deploy.
Gateway di depan; ALB di dalam VPC. Bisa keduanya dipakai (gateway → ALB → ECS).

### 11. Docker → ECR → ECS (lifecycle container)
Build image → **push ke ECR** (registry privat per akun/region) → ECS pull + jalankan task
(Fargate atau EC2). Rollback = deploy task definition revisi sebelumnya. Gunakan tag immutable
`sha-xxxx`, bukan `latest`.

### 12. Lambda Cold Starts &amp; mitigasi
Lambda tertidur saat idle → request pertama kena cold start (0.5–3 detik, tergantung runtime).
Mitigasi: **Provisioned Concurrency** (bayarkan instance tetap warm), runtime ringan (Node/Python),
singkatkan dependency, `SnapStart` (Java). Untuk endpoint dengan latensi ketat <500ms, jangan andalkan cold start.

---

## Part 3 — Databases &amp; Caching

### 13. RDS PostgreSQL vs DynamoDB
**RDS (PostgreSQL):** relasi kompleks, ACID multi-tabel (transaksi checkout), reporting SQL.
**DynamoDB:** key-value lookup cepat, skala serverless masif, traffic tidak terduga (cart, session).
**Pattern "database-per-service"** — service memilih store sesuai access pattern-nya.

### 14. Edge caching (HTTP) vs ElastiCache (Redis)
**API Gateway cache** menyimpan response HTTP jadi string JSON final — ribuan user dimirror tanpa menyentuh VPC.
**Redis (in-memory)** menyimpan object program (session, counter stok) — untuk operasi writable 
<1 ms, melindungi RDS dari overselling. Keduanya komplementer: cache di edge + cache di dalam VPC.

### 15. OpenSearch vs RDS untuk search
SQL `LIKE '%kata%'` memindai seluruh tabel dan tidak menangani typo/sinonim/relevance.
**OpenSearch** tokenisasi + fuzzy + ranking. RDS untuk yang terstruktur; OpenSearch untuk human-language search.

---

## Part 4 — Messaging &amp; Event-Driven Design

### 16. Event-driven dengan SNS + SQS
Bahasa burung: Order Service tidak memanggil Cart/Email secara synchronous. Setelah commit order →
**terbit ke SNS topic** → subscriber (SQS Cart Queue, SQS Email Queue) memproses sendiri.
Kegagalan Email tidak menggagalkan checkout. **Loose coupling + backpressure lewat antrian.**

### 17. SNS/SQS vs Kafka vs EventBridge
**SNS+SQS** = task queue, pesan dihapus setelah dikonsumsi (to-do list).
**Kafka (MSK)** = stream log tahan lama, bisa di-replay (fraud detection nanti-nanti).
**EventBridge** = smart router berbasis konten event (rule SQL-like: `orderTotal > 1000`).
Pilihan berdasarkan replay, throughput, dan routing complexity.

### 18. SQS Standard vs FIFO
**Standard:** throughput limitless, at-least-once, best-effort order → kode harus idempoten.
**FIFO:** strict order, exactly-once, limit ~3.000 msg/detik (batch) → untuk workflow finansial.

### 19. Step Functions (Orchestration / Saga)
State machine visual: Step 1 Reserve Inventory → Step 2 Charge Payment; gagal di 2 →
**compensation** (kembalikan stok) otomatis dengan retry/timeout/catch. Menggantikan distributed
transaction (2PC) yang tidak cocok untuk microservices.

---

## Part 5 — Storage, Frontend &amp; Global Delivery

### 20. Rendering Next.js di AWS
- **CSR** → S3 + CloudFront (browser rendering).
- **SSG** → S3 + CloudFront (build-time HTML).
- **SSR** → Lambda@Edge/ECS/Fargate — S3 tidak punya "otak" untuk HTML on demand.
- **ISR** → hybrid: S3 melayani cache; revalidate di background ke Lambda.
Route 53 → CloudFront → S3 (static) atau → ALB → ECS (SSR). Pilih sesuai kebutuhan.

### 21. S3 storage classes &amp; lifecycle
**Standard** (hot) → **Infrequent Access** (pan, akses bulanan) → **Glacier/Deep Archive** (brankas
bila 7 tahun kepatuhan). Lifecycle policy memindahkan otomatis berdasar umur — tidak perlu cron sendiri.

### 22. CloudFront (CDN)
Hundreds of edge locations; konten disalin terdekat dengan user. VM, S3, image, video, API cache —
user Tokyo dilayani dari Tokyo, bukan dari N. Virginia. **HTTPS/SSL via ACM bisa di-prompt di setiap region.**

### 23. Route 53 (DNS routing policies)
- **Simple** → 1 record, 1 target.
- **Weighted** → A/B test, blue/green (10% canary).
- **Latency-based** → user otomatis diarahkan ke region tercepat.
- **Failover** → health check primer gagal → traffic dilempar ke DR region.
- **Geolocation/Geoproximity** → aturan lokasi.

### 24. VPC Endpoints (PrivateLink)
Koneksi privat VPC ↔ service AWS (S3, DynamoDB, SSM) **tanpa internet/NAT Gateway**.
**Analogi:** tabung pneumatik bank → federal reserve, bukan truk curian di jalan raya.
Hemat biaya data transfer + menutup risiko exfiltration.

---

## Part 6 — DevOps, Observability &amp; Well-Architected

### 25. Microservice resilience &amp; observability
Monolith: 1 log. Microservices: request hop banyak — butuh **3 pilar observability**:
**Logs** (angka kejadian), **Metrics** (CPU, 5xx rate), **Traces** (correlation ID via OpenTelemetry/X-Ray).
Instrument, jangan cuma duga.

### 26. Sentry vs Grafana
**Grafana** = SYSTEM-level: board di TV (CPU tinggi, error rate). Menjawab **THAT** it's broken.
**Sentry** = CODE-level: exception + stack trace per release. Menjawab **WHY** it's broken.
Pakai keduanya: Grafana alarm &rarr; Sentry detail.

### 27. Terraform vs AWS CDK
**Terraform (HCL):** deklaratif, multi-cloud, state tersimpan (S3+DynamoDB lock untuk tim).
**CDK:** code imperative (TypeScript/Python) → di-synthesize ke CloudFormation; lebih ekspressif untuk AWS-native.
Jangan click-ops — semua resource lewat code (IaC).

### 28. AWS CI/CD (CodePipeline &amp; CodeBuild)
Push main → CodePipeline trigger → CodeBuild (test, build image) → ECR → CodeDeploy/ECS rolling update
(blue/green, canary) → zero downtime. AWS-native alternatif GitHub Actions.

### 29. Multi-AZ vs Multi-Region
**AZ** = grup data center independen dalam 1 region. Multi-AZ (ALB + ECS tersebar di ≥2 AZ + RDS Multi-AZ)
aden untuk survival lightning strike. **Region** = benua/geografi; Multi-Region hanya untuk
global scale/DR ekstrim (kompleksitas luar biasa). Mulai dari Multi-AZ dulu.

### 30. AWS Well-Architected Framework (6 pilar)
**Security · Reliability · Performance Efficiency · Cost Optimization · Operational Excellence · Sustainability.**
Pakai sebagai checklist review setiap desain: &ldquo;apakah ini least-privilege? apakah ada rollback?
apakah cost-aware? apakah bisa di-repeat? apakah efisien?&rdquo;

---

## Cara pakai dokumen ini

1. Tutup, lalu jawab dari ingatan: &ldquo;API Gateway vs ALB?&rdquo;, &ldquo;RDS vs DynamoDB?&rdquo;, &ldquo;cold start Lambda?&rdquo; — cek kalau salah.
2. Diskusikan jawabanmu di lab 06 (Kubernetes/Helm) dan 05 (CI/CD) untuk melihat implementasi nyatanya.
3. Setiap pertanyaan memetakan ke keputusan nyata di [`docs/04-terraform.md`](04-terraform.md) &amp; [`docs/05-cicd.md`](05-cicd.md).
