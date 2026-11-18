# Part 4 — Terraform

## Kenapa IaC?

Klik console tidak bisa di-review, tidak repeatable, dan rawan drift. Terraform mendeskripsikan infrastruktur sebagai kode yang bisa di-`plan`, di-review, dan dihapus bersih.

## Isi modul

```text
terraform/
├── versions.tf     # provider + backend (komentar)
├── variables.tf    # input + validasi
├── main.tf         # VPC, subnet, SG, IAM, EC2, EIP
├── dns.tf          # Route 53 opsional
├── outputs.tf      # IP, URL, perintah SSH/SSM
├── user-data.sh    # bootstrap Docker + swap saat boot
└── terraform.tfvars.example
```

Resource utama:

| Resource | Catatan |
| --- | --- |
| `aws_vpc`, `aws_subnet` ×2 | Multi-AZ, public subnet |
| `aws_internet_gateway`, `aws_route_table` | akses internet |
| `aws_security_group` + rules | 22 opsional, 80, 443 |
| `aws_iam_role` + profile | SSM + CloudWatch |
| `aws_instance` | Debian 13, IMDSv2, disk terenkripsi |
| `aws_eip` + association | IP statis |
| `aws_route53_record` | jika domain diisi |

## Alur

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Contoh `terraform.tfvars` minimal:

```hcl
aws_region     = "ap-southeast-3"
ssh_cidr       = "103.10.20.30/32"
ssh_public_key = "ssh-ed25519 AAAAC3... kamu@laptop"
domain_name    = "app.example.com"      # opsional
hosted_zone_name = "example.com"        # wajib jika domain diisi
```

Lalu:

```bash
terraform init
terraform fmt -recursive
terraform validate
terraform plan -out tfplan
terraform apply tfplan
```

> `terraform.tfvars` dan state **tidak** di-commit. Untuk tim, gunakan backend S3 + DynamoDB (contoh ada di `versions.tf`).

## Setelah apply

```bash
terraform output
terraform output -raw public_ip
terraform output -raw ssm_command
```

1. Clone repo ke instance (SSH/SSM).
2. `sudo bash scripts/setup-ec2.sh` — memasang Docker, swap, ufw, cron cleanup, cron backup DB.
3. Isi `.env` (termasuk `POSTGRES_*`), terbitkan sertifikat, `docker compose up -d`.

Atau gunakan `user-data.sh` yang sudah memasang Docker + swap otomatis saat boot. User-data juga membuat direktori `/opt/app/backups` untuk hasil `pg_dump`.

## Database di EC2

Database **tidak** dibuat sebagai resource Terraform terpisah (bukan RDS). PostgreSQL berjalan di dalam EC2 lewat Docker Compose:

- data disimpan di named volume `db-data` → fisiknya di **EBS root volume** instance,
- port 5432/5433 **tidak** dibuka di Security Group; hanya 22, 80, 443,
- backup harian `pg_dump` ditulis ke `/opt/app/backups` oleh cron,
- volume EBS terenkripsi (`encrypted = true` di `main.tf`).

Artinya:

- `terraform destroy` akan menghapus instance beserta database. **Backup dulu** (dan salin keluar dari EC2).
- Snapshot EBS bisa dipakai sebagai cadangan tingkat disk, tapi bukan pengganti `pg_dump`.
- Jika butuh database yang independen dari lifecycle EC2, pindah ke RDS dan set `DATABASE_URL` ke endpoint RDS. Lihat [`10-database.md`](10-database.md).

Untuk menjaga data saat mengganti instance, buat snapshot/AMI dulu, atau backup → restore ke instance baru.

## Mengubah ukuran & AMI

```hcl
instance_type     = "t3.small"    # 2 GB RAM, lebih nyaman untuk build di host
root_volume_size  = 30
ami_id            = "ami-xxxx"    # override jika Debian 13 belum tersedia di region
```

## Drift & import

- `terraform plan` harus `No changes` setelah apply.
- Jika resource dibuat manual, impor: `terraform import aws_instance.app i-...` (hatus hati-hati dengan state).
- Jangan edit resource manual di console setelah dikelola Terraform.

## Destroy

```bash
terraform destroy
```

EIP dan volume ikut terhapus. Instance ini juga menjalankan database, jadi **data guestbook ikut hilang**. Ambil backup dulu:

```bash
ssh admin@<ip> 'cd /opt/app && APP_DIR=/opt/app bash scripts/backup-db.sh'
scp admin@<ip>:/opt/app/backups/*.dump ./
```

Pastikan tidak ada data yang masih dibutuhkan sebelum destroy.

## Validasi tanpa apply

```bash
terraform fmt -check -recursive
terraform validate
terraform plan -refresh=false
```

## Catatan keamanan

- `ssh_cidr` kosong = tidak ada rule 22 (SSM-only).
- Tidak ada access key di user-data; EC2 memakai instance profile.
- Egress dibuka untuk apt, GHCR, Let's Encrypt, dan pull image PostgreSQL/Adminer.
- Database berada di EC2 yang sama; port 5432 tidak pernah dibuka ke internet.
- Untuk produksi, pindahkan app ke private subnet + ALB, dan database ke private subnet/RDS dengan TLS.
