# 04 — TERRAFORM (Infrastructure as Code)

Tiga skenario, dari aman (simulasi lokal) sampai nyata (AWS asli):

| Folder | Target | Biaya AWS | Cocok untuk |
|---|---|---|---|
| [`localstack/`](localstack/) | API AWS **tiruan** di port 4566 | **$0** | Belajar perintah Terraform & AWS CLI tanpa akun AWS |
| [`aws-real/`](aws-real/) | **EC2 asli** di akun AWS Anda | Free Tier (t3.micro) | Deploy website UTS + penuhi tugas |
| [`vm-local/`](vm-local/) | VMware/VirtualBox lewat **SSH** | **$0** | Automate konfigurasi VM lab dengan kode yang sama |

---

## 1. LocalStack (simulasi murah)

```bash
# (a) nyalakan API AWS tiruan
cd LAB/04-TERRAFORM/localstack
docker compose up -d
curl http://localhost:4566/_localstack/health | jq .

# (b) init & apply
terraform init
terraform plan          # lihat apa saja yang AKAN dibuat — bagus untuk video
terraform apply -auto-approve

# (c) buktikan dengan AWS CLI tiruan
aws --endpoint-url=http://localhost:4566 ec2 describe-instances --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]" --output table
aws --endpoint-url=http://localhost:4566 s3 ls
aws --endpoint-url=http://localhost:4566 ec2 describe-security-groups --query "SecurityGroups[*].[GroupName,GroupId]" --output table

# (d) bersihkan
terraform destroy -auto-approve
docker compose down
```

Penjelasan penting untuk video:
> Terraform membuat infrastruktur **deklaratif**. `init` = download provider,
> `plan` = preview perbedaan antara state dan realita, `apply` = eksekusi,
> `destroy` = hapus semuanya. State disimpan di `terraform.tfstate`.

---

## 2. AWS asli (EC2 deployment untuk UTS)

Prasyarat: akun AWS free tier, AWS CLI terkonfigurasi (`aws configure`), **key pair sudah dibuat**
(mis. nama `uts-ec2-aryaf`), dan website di folder proyek ini siap di-deploy.

```bash
cd LAB/04-TERRAFORM/aws-real
cp terraform.tfvars.example terraform.tfvars   # isi key_name, allowed_ssh_cidr
terraform init
terraform plan
terraform apply                                  # ketik yes
terraform output                                  # public_ip, url_website
```

Setelah apply:
1. Tunggu ~2 menit (cloud-init/user_data memasang Apache2 & menulis index.html).
2. Buka `http://<public_ip>` di browser.
3. Untuk memakai website lengkap dari repo ini:

```bash
scp -i ~/.ssh/uts-ec2-aryaf.pem -r "C:/laragon/www/UTS Ujian Tengah Semester EC2 Amazon Linux" ubuntu@<PUBLIC_IP>:/home/ubuntu/website
ssh        uts-ec2-aryaf ubuntu@<PUBLIC_IP>
cd ~/website && sudo cp -r ./* /var/www/html/
sudo chown -R www-data:www-data /var/www/html && sudo chmod -R 755 /var/www/html
sudo systemctl reload apache2
```

Cleanup (WAJIB setelah penilaian):

```bash
terraform destroy                                  # hapus EC2 + SG + ...
aws ec2 describe-instances --query "Reservations[*].Instances[*].[InstanceId,State.Name]"
```

---

## 3. VM lokal (VMware/VirtualBox) via SSH

Kode yang sama dengan di cloud, tapi target-nya VM lab Anda — membuktikan
bahwa IaC bekerja di mana pun, bukan hanya AWS.

```bash
cd LAB/04-TERRAFORM/vm-local
terraform init
terraform plan -var="ssh_user=ec2-user"    # Amazon Linux
# atau: terraform plan -var="ssh_user=ubuntu" -var="ssh_host=192.168.56.20"
terraform apply -var="ssh_user=ec2-user"
# install httpd + deploy halaman server-info, lalu cek:
curl http://192.168.56.10
```
