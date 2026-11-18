# AWS EC2 Static Website Deployment — UTS Cloud Computing

Paket deployment lengkap untuk tugas UTS Cloud Computing:

- **Nama:** Muhammad Arya Fatthurahman
- **NIM:** 2023230006
- **Kelas:** TIFM
- **Program Studi:** S1 Teknologi Informasi — Universitas Darma Persada (UNSADA)

Tujuan: deploy website statis personal (HTML/CSS) ke **AWS EC2** dan akses melalui **Public IP** (`http://<PUBLIC-IP>`), bukan localhost.

---

## Struktur folder

```
aws-deploy/
├── terraform/
│   ├── main.tf                  # EC2 + Security Group + Key Pair + Elastic IP
│   ├── variables.tf
│   ├── outputs.tf               # public_ip, ssh_command, website_url
│   ├── terraform.tfvars.example
│   └── user-data.sh             # cloud-init: install Apache2
├── ansible/
│   ├── deploy-static-apache.yml # install Apache2 + deploy website
│   ├── deploy-static-nginx.yml  # install Nginx + deploy website
│   ├── hosts                    # inventory (isi Public IP EC2)
│   └── site/                    # file website (index.html + assets/)
└── .github/workflows/
    └── deploy-ec2.yml           # CI/CD GitHub Actions
```

---

## Prasyarat

1. **Akun AWS** (free tier) — https://aws.amazon.com/free
2. **AWS CLI** terpasang + `aws configure` dengan Access Key valid:
   ```bash
   aws configure
   # AWS Access Key ID: ...
   # AWS Secret Access Key: ...
   # Default region: ap-southeast-1
   ```
3. **Terraform** >= 1.5
4. **Ansible** (opsional, untuk deployment via playbook)
5. **Git** (opsional, untuk CI/CD)

---

## Langkah 1 — Provision EC2 dengan Terraform

```bash
cd terraform

# Salin contoh konfigurasi
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars → ganti ssh_cidr dengan IP publik kamu/32

terraform init
terraform plan
terraform apply -auto-approve
```

Setelah selesai, Terraform menampilkan output:

```
public_ip     = "18.141.xxx.xxx"
ssh_command   = "ssh -i keys/uts-ec2-aryaf.pem ubuntu@18.141.xxx.xxx"
website_url   = "http://18.141.xxx.xxx"
```

> **Penting:** file private key tersimpan di `terraform/keys/uts-ec2-aryaf.pem`.
> Jangan pernah commit file ini ke Git. Jangan tampilkan di video.

---

## Langkah 2 — Deploy website (pilih salah satu)

### Opsi A: SCP manual (paling cepat)

```bash
# Dari folder UTS root (yang berisi index.html + assets/)
scp -i "UTS-EC2-WebHosting/aws-deploy/terraform/keys/uts-ec2-aryaf.pem" \
  -r index.html assets ubuntu@<PUBLIC-IP>:~/

ssh -i "UTS-EC2-WebHosting/aws-deploy/terraform/keys/uts-ec2-aryaf.pem" ubuntu@<PUBLIC-IP> \
  "sudo rm -rf /var/www/html/* && sudo mv ~/index.html ~/assets /var/www/html/ && \
   sudo chown -R www-data:www-data /var/www/html && \
   sudo find /var/www/html -type d -exec chmod 755 {} \; && \
   sudo find /var/www/html -type f -exec chmod 644 {} \; && \
   sudo systemctl reload apache2"
```

### Opsi B: Ansible

```bash
cd ansible
# Edit hosts → masukkan Public IP + path private key
ansible-playbook -i hosts deploy-static-apache.yml
# atau untuk Nginx:
# ansible-playbook -i hosts deploy-static-nginx.yml
```

### Opsi C: GitHub Actions (CI/CD)

1. Push repo ke GitHub.
2. Tambahkan **Repository Secrets**:
   - `EC2_HOST` = Public IP EC2
   - `EC2_USER` = `ubuntu`
   - `EC2_SSH_KEY` = isi file `.pem` (private key)
3. Push ke branch `main` → workflow otomatis deploy.

---

## Langkah 3 — Verifikasi

```bash
curl -I http://<PUBLIC-IP>
```

Buka browser: **`http://<PUBLIC-IP>`**

Yang harus tampil:
- Nama lengkap: **Muhammad Arya Fatthurahman**
- NIM: **2023230006**
- Kelas: **TIFM**
- Foto profil, About Me, Skills, Portofolio/Pengalaman, Kontak/Sosial

---

## Security Group (sudah otomatis via Terraform)

| Type | Port | Source | Keterangan |
|---|---|---|---|
| SSH | 22 | `ssh_cidr` (IP admin) | Akses admin |
| HTTP | 80 | `0.0.0.0/0` | Website publik |
| HTTPS | 443 | `0.0.0.0/0` | (opsional) |

---

## Public IP vs Private IP

| | Public IP | Private IP |
|---|---|---|
| Contoh | `18.141.xxx.xxx` | `172.31.x.x` |
| Bisa diakses internet | ✅ Ya | ❌ Tidak |
| Dipakai website | ✅ Ya | ❌ Tidak |
| Sumber | Elastic IP / auto-assign | VPC internal |

**Penjelasan:** Public IP adalah alamat yang terlihat dari internet (dipakai browser). Private IP hanya berlaku di dalam VPC AWS, dipakai antar-instance (mis. aplikasi ke database).

---

## Biaya & pembersihan

- **t3.micro** free tier 12 bulan (750 jam/bulan).
- **Elastic IP** yang ter-attach ke instance yang running tidak dikenai biaya tambahan; EIP tidak terpakai dikenai ~$3,6/bulan.
- Setelah penilaian UTS, **hapus semua resource**:
  ```bash
  cd terraform
  terraform destroy -auto-approve
  ```

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| `InvalidClientTokenId` | Jalankan `aws configure` dengan Access Key valid |
| Website tidak terbuka | Cek Security Group: HTTP 80 dari `0.0.0.0/0` |
| 403 Forbidden | Cek permission: `sudo chmod -R 755 /var/www/html` + owner `www-data` |
| SSH timeout | Cek `ssh_cidr` = IP publik kamu/32, dan port 22 terbuka |
| `terraform apply` gagal | Pastikan region benar & kuota EC2 tersedia |

---

## Referensi

- AWS EC2 Instance Addressing — https://docs.aws.eu/AWSEC2/latest/UserGuide/using-instance-addressing.html
- Host a Website on AWS EC2 with Nginx — builder.aws.com
- Deploy a Webpage on Ubuntu using EC2 — builder.aws.com
- Terraform EC2 + Nginx — github.com/akshayghalme/terraform-ec2-nginx
- Ansible Deploy Nginx on EC2 — github.com/devopssteps/complete-60-days-devops-course
- CI/CD Static HTML to EC2 with GitHub Actions — dev.to/aws-builders
- Build AWS VPC with Public/Private Subnets (Terraform) — blog.devgenius.io
- Deploy Apache Web Server on EC2 — builder.aws.com
