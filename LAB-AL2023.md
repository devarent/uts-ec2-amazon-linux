# Lab — Launch Amazon Linux 2023 + SSH via PuTTY

**Muhammad Arya Fatthurahman · NIM 2023230006 · TIFM**

Panduan ini memetakan langkah lab EC2 (AWS) ke **WSL2 Amazon Linux 2023** yang sudah dipasang di laptop ini, karena kredensial AWS tidak tersedia / expired.

---

## A. Situasi AWS di laptop ini

| Item | Status |
|---|---|
| AWS CLI | Terpasang (`aws-cli/2.38.4`) |
| Kredensial | **Invalid/expired** (`InvalidClientTokenId`) |
| EC2 instance | Tidak ada yang bisa ditarik |
| Solusi | Amazon Linux 2023 berjalan di **WSL2** |

---

## B. Amazon Linux 2023 di WSL2

### B.1 Identitas
| Item | Nilai |
|---|---|
| Distro | `AmazonLinux2023` |
| OS | Amazon Linux 2023 (kernel 6.1) |
| User | `ec2-user` |
| Password | `123` |
| SSH port | **2226** |
| SSH key | `C:\Users\aryaf\Downloads\awskeypair.ppk` |

### B.2 Cara membuka PuTTY
**Shortcut Desktop:** `PuTTY AmazonLinux2023 (burung).lnk`

Atau manual:
1. Buka **PuTTY**.
2. Saved Session → **AmazonLinux2023** → **Load** → **Open**.
3. Host: `127.0.0.1` · Port: `2226` · User: `ec2-user` · Key: `awskeypair.ppk`.
4. Host key fingerprint: `SHA256:+Nd7PoFjbcDAwALCLxDL4LLwr3mU9ktoGqmvbujRe1k`

### B.3 Perintah lab di dalam AL2023
```bash
sudo su
yum -y update
pwd
exit
exit
```

---

## C. Mapping lab AWS → lokal

| Lab AWS | Lokal (WSL2) |
|---|---|
| Sign in AWS Console | Tidak perlu (offline) |
| Region us-east-1 | Tidak berlaku |
| Launch instance `MyEC2Server` | Distro `AmazonLinux2023` |
| AMI Amazon Linux 2023 | Amazon Linux 2023 rootfs import |
| Instance type t2.micro | Container-like env (ringan) |
| Key pair `SSHkey` | `awskeypair.pem` / `awskeypair.ppk` |
| Security Group SSH | WSL2 localhost forwarding (2226) |
| Public IP | `127.0.0.1:2226` |
| SSH user | `ec2-user` |
| `sudo su` | `sudo su` |
| `yum -y update` | `yum -y update` |

---

## D. Website lokal (sudah online)

| URL | Hasil |
|---|---|
| `http://192.168.100.3` | HTTP 200 — Portofolio Arya |
| `http://192.168.100.3/uts/` | HTTP 200 — Versi lengkap |
| `https://recycling-bureau-kitty-walnut.trycloudflare.com` | URL publik sementara (Cloudflare Tunnel) |

---

## E. Kalau nanti punya akses AWS lagi

1. `aws configure` (isi Access Key + Secret Key + region `us-east-1`).
2. Launch instance sesuai panduan lab:
   - AMI: Amazon Linux 2023
   - Type: t2.micro
   - Key pair: `SSHkey` (.ppk)
   - Security Group: SSH 22 dari My IP
3. Catat **Public IPv4**.
4. PuTTY → `ec2-user@<IP>` port 22 + `SSHkey.ppk`.

---

## F. Key pair `awskeypair`

| File | Lokasi |
|---|---|
| Private key (OpenSSH) | `C:\Users\aryaf\Downloads\awskeypair.pem` |
| Private key (PuTTY) | `C:\Users\aryaf\Downloads\awskeypair.ppk` |
| Public key | `C:\Users\aryaf\Downloads\awskeypair.pub` |

Fingerprint: `SHA256:GX8TqI+SVPN+9a94J25wPJQZSXkAV767uxrl55KpZIs`

> Jangan bagikan file `.pem` / `.ppk`. Itu kunci privat.

---

## G. Troubleshooting

| Gejala | Solusi |
|---|---|
| AL2023 tidak merespon | Tutup VS Code / app berat, lalu `wsl --shutdown` dan buka shortcut lagi |
| PuTTY: host key berubah | Klik Accept; jika yakin distro sama |
| PuTTY: connection refused | Jalankan `systemctl start sshd` di AL2023 |
| RAM hampir habis | Tutup beberapa window VS Code |
| AWS CLI `InvalidClientTokenId` | `aws configure` dengan key baru |
