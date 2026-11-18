# 02 — WSL2 UBUNTU: "CLOUD CONTROL CENTER" DI WINDOWS

WSL2 dipakai sebagai **workstation DevOps**: dari sinilah kita
**SSH ke VM (emulasi EC2)**, menjalankan **Terraform**, **Docker**, **kubectl/kind**, dan **AWS CLI ke LocalStack**.

> Analogi: WSL2 = laptop Anda saat melakukan `ssh -i key.pem ubuntu@IP` ke instance EC2.

---

## A. Install WSL2 + Ubuntu 24.04

Di **PowerShell (Run as Administrator)**:

```powershell
wsl --install                      # mengaktifkan WSL2 + Virtual Machine Platform (+ Ubuntu default)
# Restart bila diminta
wsl --install -d Ubuntu-24.04      # install distro Ubuntu 24.04
wsl --set-version Ubuntu-24.04 2
wsl --set-default Ubuntu-24.04
wsl --list --verbose
```

Setelah terbuka pertama kali, buat **username & password** (mis. `aryaf`).
Catat — password ini tidak perlu ditampilkan di video.

---

## B. Install semua tool sekaligus (disarankan)

Di terminal **WSL2 Ubuntu**:

```bash
# salin folder LAB ke WSL2 (atau clone/folder bersama)
bash /path/ke/LAB/02-WSL2/install-tools.sh
```

Script ini memasang: **Docker Engine + Compose plugin, Terraform, kubectl, kind, AWS CLI v2, helm, jq, make, openssh, git, rsync**.

Kalau mau manual, ikuti langkah C–G di bawah.

---

## C. Update WSL2

```bash
sudo apt update -y && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg lsb-release apt-transport-https git make unzip jq rsync openssh-client
```

---

## D. Docker Engine

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update -y
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
# aktifkan service
sudo service docker start
docker version          # pastikan Client & Server jalan
```

> Alternatif lebih mudah: **Docker Desktop for Windows** dengan backend WSL2.
> Aktifkan integrasi di *Settings → Resources → WSL Integration → Ubuntu-24.04*.
> Setelah itu `docker` langsung bisa dipakai di WSL2 tanpa install Engine manual.

---

## E. Terraform

```bash
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update -y
sudo apt install -y terraform
terraform version
```

---

## F. kubectl + kind (Kubernetes di Docker)

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
kubectl version --client

curl -Lo /tmp/kind https://kind.sigs.k8s.io/dl/v0.27.0/kind-linux-amd64
chmod +x /tmp/kind && sudo mv /tmp/kind /usr/local/bin/kind
kind version
```

---

## G. AWS CLI v2

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install
aws --version
aws configure set region us-east-1
aws configure set output json
# Gunakan credential PALSU untuk LocalStack:
aws configure set aws_access_key_id test
aws configure set aws_secret_access_key test
```

---

## H. LocalStack (simulasi API AWS di komputer)

```bash
docker run --rm -d --name localstack -p 4566:4566 -p 4510-4559:4510-4559 localstack/localstack:3.7
curl http://localhost:4566/_localstack/health | jq .
```

Atau dengan compose (lihat [`../04-TERRAFORM/localstack/docker-compose.yaml`](../04-TERRAFORM/localstack/docker-compose.yaml)).

---

## I. Verifikasi environment

```bash
docker --version && docker compose version
terraform --version
kubectl version --client
kind version
aws --version
echo "--- SSH ke VM ---"
ssh -i ~/.ssh/lab_ec2 ec2-user@192.168.56.10 'cat /etc/os-release | head -n2'
ssh -i ~/.ssh/lab_ec2 ubuntu@192.168.56.20  'cat /etc/os-release | head -n2'
```

---

## J. WSL2 — tips supaya lancar dipakai dengan VMware/VirtualBox

1. WSL2 & VM jalan **bersamaan** — tidak saling konflik, tetapi sama-sama memakan resource.
2. Akses VM dari WSL2 memakai **IP Host-Only** `192.168.56.10` (paling stabil),
   karena WSL2 punya NAT sendiri yang terpisah dari Windows.
3. Akses dari **Windows host** ke VM: coba `ssh` di PowerShell (Windows OpenSSH) atau pakai NAT IP.
4. Folder bersama WSL2↔Windows: path WSL2 di Windows adalah `\\wsl.localhost\Ubuntu-24.04\...`.
5. Simpan key `lab_ec2` di WSL2 (`~/.ssh`) **dan** di folder Windows jika ingin dipakai lewat PowerShell;
   jangan pernah commit `lab_ec2` ke repository publik.
