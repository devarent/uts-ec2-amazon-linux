# 00 — PANDUAN UTAMA LAB CLOUD COMPUTING (Lokal)

> **Lab ini adalah "laboratorium AWS EC2" di komputer lokal Anda.**
> Tujuannya: Anda bisa memahami dan **mendemonstrasikan** seluruh tahapan tugas UTS
> (SSH, Public/Private IP, web server, permission, Docker, Terraform, Kubernetes)
> **tanpa menunggu quota AWS**, sebelum melakukan deployment sungguhan ke EC2 asli.

---

## 1. Peta Arsitektur Lab

```
┌──────────────────────── WINDOWS HOST (Laptop) ─────────────────────────┐
│                                                                          │
│  ┌── WSL2 Ubuntu 24.04  ─ "Cloud Control Center / DevOps Workstation" ─┐ │
│  │  • Docker Engine / Docker Compose                                  │ │
│  │  • Terraform (IaC)  • kubectl + kind                               │ │
│  │  • AWS CLI  →  LocalStack (simulasi API AWS)                       │ │
│  │  • SSH client ke VM (public key emulation)                         │ │
│  └───────────────┬──────────────────────────────────────────────────┘ │
│                  │ 192.168.56.0/24 (Host-Only = "VPC Private")         │
│                  │ 10.0.2.0/24     (NAT      = "Internet / Public")     │
│  ┌───────────────▼──────────────────────────────────────────────────┐ │
│  │  VMware Workstation / VirtualBox                                  │ │
│  │  ┌────────────────────────────┐   ┌────────────────────────────┐  │ │
│  │  │ VM-1  Amazon Linux 2023    │   │ VM-2  Ubuntu 24.04 LTS     │  │ │
│  │  │  = "EC2 Instance"          │   │  = "Worker / K8s Node"     │  │ │
│  │  │  192.168.56.10 (private)   │   │  192.168.56.20 (private)   │  │ │
│  │  │  10.0.2.15   (public NAT)  │   │  httpd + Docker + k3s      │  │ │
│  │  │  httpd/Apache2 :80         │   │  NodePort 30080           │  │ │
│  │  │  Docker nginx :8080        │   └────────────────────────────┘  │ │
│  │  └────────────────────────────┘                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌── KIND (Kubernetes in Docker, di dalam WSL2) ─────────────────────┐  │
│  │  nginx Deployment + Service NodePort  →  http://192.168.100.3:8080     │ │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌── LocalStack (di WSL2, port 4566) ────────────────────────────────┐  │
│  │  API AWS tiruan: EC2, VPC, S3, IAM  → dipakai Terraform & AWS CLI │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Mengapa ini mirroring AWS?

| Konsep AWS | Padanan di Lab Lokal |
|---|---|
| EC2 Instance | VM-1 Amazon Linux 2023 di VMware/VirtualBox |
| Private IP | IP statis **Host-Only** `192.168.56.10` |
| Public IP | IP **NAT** `10.0.2.15` (dijangkau dari luar VM, seperti public IP) |
| Security Group | `firewalld` (AL2023) / `ufw` (Ubuntu) + tabel Allow/Deny |
| Key Pair (SSH) | Key pair RSA buatan sendiri → `authorized_keys` |
| Web Server | `httpd` (Amazon Linux) / `apache2` (Ubuntu) / container `nginx` |
| Document Root | `/usr/share/httpd/html` (AL2023) / `/var/www/html` (Ubuntu) |
| Public/Private Subnet | 2 adapter: NAT (public) + Host-Only (private) |
| IaC / Terraform | Terraform provision VM & service via SSH + LocalStack |
| Kubernetes | k3s (di VM Ubuntu) dan/atau kind (di WSL2) |
| Load Balancer / Ingress | Nginx Ingress / Service NodePort |
| IAM / Access Key | LocalStack credential palsu (`test`/`test`) |

---

## 2. Prasyarat ( installs )

| Kebutuhan | Keterangan |
|---|---|
| VMware Workstation Pro **atau** Oracle VirtualBox | Salah satu saja cukup |
| WSL2 + Ubuntu 24.04 | `wsl --install -d Ubuntu-24.04` |
| Docker | Docker Desktop (WSL2 backend) **atau** Docker Engine di WSL2 |
| 8 GB RAM bebas | 2 VM + Docker + WSL2 |
| 60 GB disk kosong | |

> 💡 Kalau RAM terbatas: **VM-2 (Ubuntu/k3s) boleh dilewati** dan k8s dijalankan dengan **kind** di WSL2.

---

## 3. Urutan Kerja (Ikuti Berurutan)

| Step | Folder | Target | Output |
|---|---|---|---|
| 1 | [`01-VM/`](01-VM/) | Buat VM-1 Amazon Linux 2023 + VM-2 Ubuntu | 2 VM jalan, IP statis |
| 2 | [`01-VM/amazon-linux/`](01-VM/amazon-linux/) | httpd, SSH key pair, firewall | `curl http://192.168.56.10` OK |
| 3 | [`02-WSL2/`](02-WSL2/) | Install tool di WSL2 | docker, terraform, kubectl, kind OK |
| 4 | [`03-DOCKER/`](03-DOCKER/) | Build & run image website | `docker ps` healthy |
| 5 | [`04-TERRAFORM/`](04-TERRAFORM/) | IaC: LocalStack + AWS real + VM lokal | `terraform apply` sukses |
| 6 | [`05-KUBERNETES/`](05-KUBERNETES/) | kind cluster + manifest website | `http://192.168.100.3:8080` |
| 7 | [`06-SERVER/`](06-SERVER/) | Halaman status server | `http://192.168.56.10/status.html` |
| 8 | [`skrip/cek-lab.sh`](skrip/cek-lab.sh) | Verifikasi menyeluruh | Laporan health check |

---

## 4. Pemetaan ke Rubrik UTS

| Ketentuan UTS | Démonstrasi di Lab | Perintah/Artefak |
|---|---|---|
| **1. Konfigurasi AWS EC2** (Region, Instance Type, Key Pair, Security Group) | Terraform membuat "infrastruktur" (VPC, SG 22/80, Instance) | `LAB/04-TERRAFORM/localstack/` + `aws-real/` |
| **Penjelasan Public IP vs Private IP** | 2 adapter di 1 VM, `ip -br addr` menunjukkan 2 IP berbeda | `01-VM/.../netplan-static-ip.yaml` |
| **2. Konfigurasi VPS** (SSH, update, install & status web server) | `ssh -i key ec2-user@192.168.56.10`, `dnf update`, `systemctl status httpd` | `setup-httpd.sh` |
| **3. Deployment website** (upload, permission) | `scp`, `chown/chmod 755/644`, `docker build/run`, `kubectl apply` | `deploy.sh`, `Dockerfile`, `manifests/` |
| **4. Pengujian** (Running, bisa dibuka, nama & NIM tampil) | `curl` dari WSL2/host/HP, `kubectl get pods -o wide` | `skrip/cek-lab.sh` |
| **Penjelasan Instance, SG, SSH, web server** | Bagian "Penjelasan Konsep" di `00-PANDUAN-UTAMA.md` | — |

> ⚠️ **Penting untuk nilai tugas:** Lab ini adalah **latihan & alat bantu menjelaskan**.
> **Pengumpulan tetap wajib** memakai instance **EC2 asli** di AWS (Public IP asli) +
> video yang menunjukkannya. Kalau biaya/quota AWS tidak tersedia, hubungi dosen sebelum deadline.

---

## 5. Penjelasan Konsep (siap dipakai di video)

### 5.1 EC2 Instance
Mesin virtual (VPS) yang disewa dari AWS.	src: AMI (Ubuntu/Amazon Linux), ukuran: *Instance Type*
(t3.micro), jaringan: *VPC/Subnet*, akses: *Key Pair + SSH*. Status: `pending → running → stopping → stopped → terminated`.

### 5.2 Key Pair
Sepasang kunci asimetris: **public key** dipasang di server (`~/.ssh/authorized_keys`),
**private key** (`.pem`) disimpan di laptop. Private key **tidak pernah** dikirim ke server maupun ditampilkan di video.

### 5.3 Security Group
Firewall **stateful** per instance. Default: semua inbound ditolak.
Kita tambahkan rule **SSH/TCP/22** (dari IP admin) dan **HTTP/TCP/80** (dari 0.0.0.0/0).
Padanan lokal: `firewall-cmd --list-all` (AL2023) / `ufw status` (Ubuntu).

### 5.4 SSH
Protokol remote shell terenkripsi (port 22). Perintah dasar:
`ssh -i key.pem user@ip` · copy file: `scp -i key.pem file user@ip:/path` · salin folder: `scp -r`.

### 5.5 Web Server
Program yang **listening di port 80**, menerima request HTTP, dan menyajikan file dari
*document root* (`/usr/share/httpd/html` atau `/var/www/html`). Contoh: Apache `httpd`, Nginx.
Dinyalakan dengan `systemctl enable --now httpd` → otomatis jalan saat server menyala.

### 5.6 Public IP vs Private IP
* **Private IP** → hanya dalam jaringan internal/VPC, tidak bisa dijangkau internet.
* **Public IP** → alamat publik, bisa dijangkau siapa pun (dibatasi Security Group).
* Di lab: `192.168.56.10` = private (Host-Only), `10.0.2.15` = public (NAT).

### 5.7 Docker vs Virtual Machine
| | Virtual Machine | Docker Container |
|---|---|---|
| Isolasi | OS kernel penuh | Process + namespace, berbagi kernel |
| Ukuran | GB | MB |
| Start | 30–60 detik | < 1 detik |
| Padanan AWS | EC2 Instance | ECS / EKS Pod |

### 5.8 Terraform (IaC)
Menulis infrastruktur sebagai **kode** (HCL). Perintahnya: `init` → `validate` → `plan` → `apply` → `destroy`.
Keuntungan: repeatable, versionable, dokumentasi otomatis, tidak ada klik-klik manual.

### 5.9 Kubernetes
Orkestrator container. Objek inti: **Pod** (unit terkecil), **Deployment** (replica + self-healing),
**Service** (IP stabil & load balancing), **ConfigMap/Secret**, **Ingress** (HTTP router),
**Namespace** (isolasi). Manifest = YAML deklaratif → `kubectl apply -f`.

---

## 6. Perintah Pendamping (cheat sheet)

```bash
# SSH ke VM (emulasi EC2)
ssh -i ~/.ssh/lab_ec2.pem ec2-user@192.168.56.10
ssh -i ~/.ssh/lab_ec2.pem ubuntu@192.168.56.20

# Web server (Amazon Linux 2023)
sudo systemctl status httpd
sudo systemctl enable --now httpd
sudo ss -tlnp | grep :80

# Web server (Ubuntu)
sudo systemctl status apache2

# Permission
sudo chown -R apache:apache /usr/share/httpd/html   # AL2023
sudo chown -R www-data:www-data /var/www/html       # Ubuntu
sudo find /usr/share/httpd/html -type d -exec chmod 755 {} \;
sudo find /usr/share/httpd/html -type f -exec chmod 644 {} \;

# Docker
docker ps -a ; docker logs -f <container> ; docker compose up -d
docker exec -it <container> sh

# Terraform
terraform init ; terraform validate ; terraform plan ; terraform apply ; terraform destroy

# Kubernetes
kubectl get nodes ; kubectl get pods -o wide ; kubectl get svc
kubectl describe pod <pod> ; kubectl logs -f <pod>
kubectl apply -f manifests/ ; kubectl rollout restart deployment/website

# Uji
curl -I http://192.168.56.10 ; curl -s http://192.168.56.10 | grep 2023230006
```

---

## 7. Estimasi Waktu

| Step | Estimasi |
|---|---|
| 1–2 (VM + web server) | 2–3 jam (termasuk unduh ISO & update) |
| 3 (WSL2 tools) | 45 menit |
| 4 (Docker) | 30 menit |
| 5 (Terraform) | 1 jam |
| 6 (Kubernetes) | 1 jam |
| 7 (Status page) | 20 menit |
| **Total** | **± 6–7 jam** |

---

## 8. Urutan Kerja yang Direkomendasikan untuk Nilai/video

1. **Coba lab lokal dulu** sampai semua hidup (Step 1–7) agar paham tiap konsep.
2. **Buat instance EC2 asli** (panduan di [`../README.md`](../README.md)) — cukup 30 menit.
3. **Upload website** dari repo ini ke EC2 asli, deploy dengan Apache2/Nginx.
4. **Rekam video** : buka dengan wajah terlihat → jelaskan tiap konsep sambil menunjukkan
   lab **dan** EC2 asli → demo `http://<PUBLIC-IP-EC2>` (bukan localhost).
5. **Cleanup**: `terraform destroy`, stop/terminate EC2, hapus VM & LocalStack.

---

## 9. Troubleshooting Umum

| Gejala | Penyebab | Solusi |
|---|---|---|
| VM tidak dapat ping dari WSL2 | WSL2 & host-only di subnet berbeda | Samakan subnet (WSL2 akses via IP Windows) atau pakai NAT IP |
| `ssh: Permission denied (publickey)` | Key/salah user/izin file | `chmod 600 key.pem`, user AL2023 = `ec2-user`, Ubuntu = `ubuntu` |
| `curl` timeout | httpd mati / firewall | `systemctl status httpd`, `firewall-cmd --list-all` |
| Halaman 403 | permission salah | `chmod 755` folder, `chown` ke user web server |
| `docker: permission denied` | user belum masuk group docker | `sudo usermod -aG docker $USER` lalu logout-login |
| kind gagal start di WSL2 | WSL2 virtualization | pastikan WSL2 + Virtual Machine Platform aktif; `docker info` OK |
| LocalStack `endpoint` error | container belum ready | `curl http://localhost:4566/_localstack/health` |
