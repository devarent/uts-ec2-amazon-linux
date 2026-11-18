# Catatan Arsitektur AWS (ringkasan 30 topik)

Ringkasan cepat dari handbook arsitektur yang dipakai di seri ini. Cocok untuk review sebelum interview atau saat mengambil keputusan desain.

---

## Part 1 — Network & security

### 1. Secrets di dev vs produksi
Lokal: `.env` (jangan commit). Produksi: **SSM Parameter Store** (gratis untuk standard) atau **Secrets Manager** (rotasi otomatis). Di ECS, inject lewat `secrets` di task definition sehingga kode cukup membaca `process.env`. Jangan menaruh access key di image/repo.

### 2. VPC isolation
VPC adalah jaringan privat milikmu. Backend & database di **private subnet** tanpa public IP sehingga tidak bisa diakses langsung dari internet. Hanya load balancer/API Gateway di public subnet yang menghadap keluar.

### 3. Public API vs backend “tersembunyi”
DevTools hanya melihat request sampai edge (API Gateway/ALB). Setelah itu trafik masuk ke VPC. “Hidden” berarti tidak ada jalur routing langsung dari internet ke instance — bukan berarti request-nya tidak terlihat.

### 4. IAM Role vs Policy
- **Policy** = dokumen JSON berisi izin.
- **Role** = identitas sementara yang bisa dipakai service (EC2/ECS/Lambda) untuk mendapat kredensial berputar.

EC2 memakai **instance profile**; EKS memakai **IRSA**; CI memakai **OIDC federation**. Hindari access key permanen.

### 5. Cognito User Pool vs Identity Pool
- **User Pool**: database user, sign-up/login, MFA, JWT.
- **Identity Pool**: menukar token (Cognito/sosial) menjadi kredensial IAM sementara untuk akses langsung ke AWS (mis. upload ke S3).

### 6. WAF & Shield
**WAF** memfilter HTTP (SQLi, XSS, rate limit, geo/IP) di CloudFront/ALB/API Gateway. **Shield Standard** gratis untuk DDoS layer 3/4; **Shield Advanced** menambah respons tim dan proteksi biaya.

### 7. KMS & encryption at rest
KMS mengelola key untuk S3/EBS/RDS. Data dienkripsi di disk; aplikasi tidak perlu menulis algoritma enkripsi. Aktifkan enkripsi default dan batasi `kms:Decrypt` lewat IAM.

---

## Part 2 — Compute & microservices

### 8. EC2 vs ECS vs VPC vs Serverless
- **VPC**: jaringan.
- **EC2**: VM, kamu mengelola OS.
- **ECS**: orkestrasi container (EC2 atau Fargate).
- **Serverless/Fargate/Lambda**: kamu tidak mengelola server, bayar per pemakaian.

### 9. Public vs protected route
API Gateway bisa menerapkan authorizer per route. `GET /products` tanpa auth; `POST /orders` dengan Cognito/JWT. Request tidak valid ditolak 401 sebelum masuk VPC.

### 10. API Gateway vs ALB
API Gateway: edge, auth, quota, transformasi, cocok untuk banyak service/serverless. ALB: load balancing layer 7 di dalam VPC, health check, path/host routing, integrasi ECS/EC2. Sering dipakai bersama.

### 11. Docker → ECR → ECS
Build image → push ke **ECR** → ECS menarik image → menjalankan task di Fargate/EC2. Image diberi tag immutable (sha), bukan hanya `latest`.

### 12. Lambda cold start
Inisialisasi runtime saat function pertama dipanggil. Mitigasi: provisioned concurrency, package lebih kecil, hindari inisialisasi berat, pilih runtime ringan, atau pindah ke container/ECS bila latency ketat.

---

## Part 3 — Database & caching

### 13. RDS vs DynamoDB
RDS: relasi, join, transaksi ACID, reporting. DynamoDB: key-value, skala horizontal, latency rendah, serverless. Pilih berdasarkan access pattern, bukan tren.

### 14. Edge cache vs Redis
API Gateway/CloudFront cache respons HTTP (read-only, publik). ElastiCache Redis menyimpan objek/session/counter yang bisa ditulis, mis. stok flash sale. Keduanya bisa dipakai bersamaan.

### 15. OpenSearch vs SQL search
`LIKE '%kata%'` tidak skalabel dan tidak toleran typo. OpenSearch mendukung tokenisasi, fuzzy, sinonim, ranking. Gunakan untuk search; tetap simpan source of truth di RDS.

---

## Part 4 — Messaging & event-driven

### 16. SNS + SQS
Order service publish event ke SNS; queue SQS di tiap consumer menyerap burst dan memberi retry/DLQ. Checkout tidak ikut gagal bila email service down.

### 17. SNS/SQS vs Kafka vs EventBridge
- **SNS+SQS**: task queue sederhana, pesan dihapus setelah diproses.
- **Kafka/MSK**: log event append-only, replay untuk consumer baru.
- **EventBridge**: routing berbasis isi event, integrasi SaaS/AWS, schedule.

### 18. SQS Standard vs FIFO
Standard: throughput tinggi, at-least-once, ordering best-effort → consumer harus idempoten. FIFO: ordering ketat + exactly-once processing, throughput lebih rendah.

### 19. Step Functions
State machine untuk saga/orkestrasi multi-langkah: retry, timeout, parallel, compensation. Lebih mudah diaudit dibanding rantai Lambda yang saling memanggil.

---

## Part 5 — Storage, frontend, delivery

### 20. Rendering Next.js di AWS
- **CSR**: static di S3/CloudFront.
- **SSG**: build time, static.
- **SSR**: butuh compute (ECS/Lambda).
- **ISR**: hybrid; halaman di-cache lalu di-revalidate di background.

Next.js `output: "standalone"` cocok untuk ECS/EC2/Docker.

### 21. S3 storage class
Standard (hot) → Standard-IA (jarang, retrieval fee) → Glacier Instant/Flexible/Deep Archive (arsip). Atur lifecycle transition + expiration.

### 22. CloudFront
Cache di edge location, menurunkan latency dan beban origin. Dukung HTTPS ACM, WAF, signed URL, origin S3 (OAC) atau ALB.

### 23. Route 53 routing
Simple, weighted, latency, failover, geolocation, geoproximity, multivalue. Failover butuh health check. TTL rendah mempercepat perubahan tapi menambah query.

### 24. VPC Endpoint
PrivateLink menghubungkan VPC ke S3/DynamoDB/service lain tanpa internet/NAT. Gateway endpoint (S3/DynamoDB) gratis; interface endpoint berbiaya per jam + data.

---

## Part 6 — DevOps, observability, architecture

### 25. Observability
Tiga pilar: **logs**, **metrics**, **traces**. Di microservices, correlation/trace ID menghubungkan satu request lintas service. Tanpa itu debugging jadi tebak-tebakan.

### 26. Sentry vs Grafana
Grafana: dashboard metrik/infrastruktur, menjawab “sistem sedang bermasalah?”. Sentry: exception + stack trace, menjawab “kenapa baris kode ini gagal?”. Komplementer.

### 27. Terraform vs CDK
Terraform: HCL deklaratif, multi-cloud, ekosistem provider luas. CDK: bahasa pemrograman (TS/Python), menghasilkan CloudFormation, kuat untuk logika kompleks di AWS. Pilih satu, konsisten.

### 28. CodePipeline & CodeBuild
Source → build/test (CodeBuild) → push ECR → deploy (CodeDeploy/ECS). Padanan di repo ini: GitHub Actions + GHCR + SSH/Compose, atau Helm untuk K8s.

### 29. Multi-AZ vs multi-Region
Multi-AZ: tahan kegagalan satu data center, latency rendah, operasional sederhana. Multi-Region: tahan kegagalan region, kompleks (replikasi, konsistensi, DNS failover, biaya). Mulai dari Multi-AZ.

### 30. Well-Architected Framework
Enam pilar: **Security, Reliability, Performance Efficiency, Cost Optimization, Operational Excellence, Sustainability**. Gunakan sebagai checklist review, bukan sertifikasi sekali jadi.

---

## Pemetaan ke lab ini

| Topik | Implementasi di repo |
| --- | --- |
| IAM role | EC2 instance profile SSM + CloudWatch |
| VPC | Terraform VPC + public subnet |
| Security group | hanya 22/80/443 |
| Container | Docker multi-stage, non-root |
| HTTPS | Nginx + Let's Encrypt |
| DNS | Route 53 opsional di Terraform |
| CI/CD | GitHub Actions + GHCR + rollback |
| Observability | `/api/health`, CloudWatch alarm, log rotation |
| IaC | Terraform |
| Orchestration | Helm + manifest K8s |
| Cost | budget alert + `terraform destroy` |
