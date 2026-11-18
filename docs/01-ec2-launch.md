# Part 1 — Launch EC2

Dokumen ini mengikuti alur video, dengan pengamanan yang lebih baik.

## 1. Pilih region

Gunakan region terdekat, mis. **Asia Pacific (Jakarta) `ap-southeast-3`**. Region memengaruhi latency, harga, dan ketersediaan AMI.

## 2. Launch instance

EC2 → **Launch an instance**:

| Field | Nilai |
| --- | --- |
| Name | `SERVER AWS AJI` |
| AMI | **Debian 13** (x86_64) / Ubuntu 24.04 |
| Instance type | `t3.micro` (free tier) |
| Key pair | buat baru, **RSA**, `.pem` |
| Storage | 20 GiB **gp3**, encrypted |
| Auto-assign public IP | Enable |
| Firewall | SG baru: SSH (My IP), HTTP, HTTPS |

> Video memilih “Allow all traffic” untuk mempermudah. Jangan lakukan di akun nyata.

## 3. Security group final

Ganti nama SG `launch-wizard-1` → `mySecurity` (optional, tapi membantu).

| Rule | Port | Source | Alasan |
| --- | --- | --- | --- |
| SSH | 22 | `IP-kamu/32` | admin |
| HTTP | 80 | `0.0.0.0/0` | redirect + ACME |
| HTTPS | 443 | `0.0.0.0/0` | aplikasi |

Egress: allow all (apt, Docker Hub/GHCR, Let's Encrypt).

**Jangan** menambahkan 3000, 5432, 6379. Container app hanya diakses Nginx lewat network internal Docker.

## 4. Elastic IP

Tanpa EIP, public IPv4 dilepas saat instance stop/start. DNS yang menunjuk IP lama akan mati.

1. **Elastic IPs → Allocate Elastic IP address**.
2. **Associate** ke instance.
3. Pasang A record domain ke IP ini.

Elastic IP yang idle (tidak terasosiasi) tetap ditagih kecil — release jika tidak dipakai.

## 5. Connect

Browser: **Connect → EC2 Instance Connect → Connect**.

SSH:

```bash
chmod 400 awskeypair.pem
ssh -i awskeypair.pem admin@16.78.1.204
```

- Debian: user `admin`
- Ubuntu: user `ubuntu`
- Amazon Linux: user `ec2-user`

Jika `Permission denied (publickey)`:

1. Pastikan key yang dipakai memang pasangan key instance.
2. Cek permission file (`400` di Linux/macOS).
3. Pastikan user benar.
4. Cek `/var/log/auth.log` lewat console/SSM.

## 6. Tanpa port 22 (lebih aman)

Lampirkan role `AmazonSSMManagedInstanceCore` ke instance, lalu:

```bash
aws ssm start-session --target i-019778eac5a976f92 --region ap-southeast-3
```

Terraform di repo ini sudah membuat role + instance profile-nya. Dengan SSM, port 22 bisa ditutup total.

## 7. Verifikasi

```bash
# di EC2
curl -s http://169.254.169.254/latest/meta-data/instance-id
free -h
df -h /
```

Lanjut ke [Part 2 — Docker](02-docker-nginx.md).
