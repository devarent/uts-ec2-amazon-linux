# 01 — VMWARE / VIRTUALBOX: MEMBUAT "INSTANCE EC2" LOKAL

Di bagian ini kita membuat dua mesin virtual (VM):

| VM | OS | Fungsi | IP (Host-Only) | IP (NAT) |
|---|---|---|---|---|
| **vm-ec2-amazonlinux** | **Amazon Linux 2023** (fallback: Ubuntu 24.04) | "Instance EC2" / VPS utama | `192.168.56.10` | `10.0.2.15` |
| **vm-worker-ubuntu** | Ubuntu Server 24.04 LTS | Node Kubernetes (k3s) + penguji | `192.168.56.20` | `10.0.2.20` |

> Kalau RAM terbatas, buat **vm-ec2-amazonlinux saja**, dan jalankan Kubernetes dengan **kind** di WSL2.

---

## A. Persiapan (download file)

### A.1 Amazon Linux 2023 ISO

1. Buka halaman dokumentasi AWS: **Amazon Linux 2023 → ISO images**
   (cari: `Amazon Linux 2023 ISO download site:docs.aws.amazon.com`).
2. Unduh file pola berikut (tanggal di nama file berubah):
   ```
   al2023-x86_64-minimal-<tanggal>.iso
   ```
3. Simpan di `C:\Users\aryaf\Downloads\iso\`.

> VirtualBox & VMware keduanya bisa memasang ISO tersebut.
> **Fallback**: jika instalasi ISO Amazon Linux membingungkan, gunakan **Ubuntu Server 24.04 LTS**
> (`https://ubuntu.com/download/server`). Semua langkah dipanduan ini punya padanannya
> (`dnf` → `apt`, `/usr/share/httpd/html` → `/var/www/html`, user `ec2-user` → `ubuntu`).

### A.2 Ubuntu Server 24.04 LTS ISO

```
https://releases.ubuntu.com/24.04/ubuntu-24.04.3-live-server-amd64.iso
```
(versi terbaru: lihat `https://releases.ubuntu.com/24.04/`)

### A.3 Catatan penting dibanding EC2 asli

| Fitur di EC2 asli | Padanan di Lab |
|---|---|
| `ec2-user` / `ubuntu` default user | user yang Anda buat saat install |
| Key Pair `.pem` | key RSA buatan sendiri (`lab_ec2.pem`) |
| Security Group | `firewalld` + tabel allow/deny |
| Public IPv4 dinamis | IP NAT `10.0.2.15` (gateway NAT di host) |
| Private IP `10.0.x.x` | IP Host-Only `192.168.56.10` |
| `/etc/amazon/aws-ami` metadata | `curl 169.254.169.254/latest/meta-data/` (LocalStack) |

---

## B. Setting jaringan (KEDUA Virtualisasi)

### VirtualBox

1. **File → Tools → Network Manager** → pastikan **Host-only Network** sudah ada
   (`VirtualBox Host-Only Ethernet Adapter`).
   - IP: `192.168.56.1` / netmask `255.255.255.0`
   - DHCP: **dimatikan** (kita set IP statis)
2. Untuk setiap VM: **Devices → Network → Network Settings**
   - **Adapter 1**: `Attached to: NAT`
   - **Adapter 2**: `Attached to: Host-only Adapter` → pilih adapter di atas
3. Nama adapter di dalam guest (cari dengan `ip -br addr`):
   biasanya `enp0s3` (NAT) dan `enp0s8` (Host-Only).

### VMware Workstation

1. **Edit → Virtual Network Editor**
   - **VMnet8 (NAT)**: aktifkan "Connect a host virtual adapter" & DHCP
   - **VMnet1 (Host-only)**: ubah Subnet IP ke `192.168.56.0/24`,
     matikan **"Use local DHCP service"** (agar IP statis)
2. VM settings → **Network Adapter**
   - **Adapter 1**: NAT → status "Connected"
   - **Add... → Network Adapter** → **Host-only** → pilih VMnet1
3. Nama adapter di guest: `ens33` (NAT) dan `ens37` (Host-Only) — cek dengan `ip -br addr`.

---

## C. Membuat VM-1 (Amazon Linux 2023)

1. **VirtualBox**: New → Name `vm-ec2-amazonlinux`, Type `Linux`, Version `Red Hat (64-bit)`;
   **VMware**: Create New Virtual Machine → Custom → Guest OS → Linux.
2. RAM **2048 MB**, CPU **2**, Disk **20 GB** (dynamically allocated / single file).
3. Setelah VM jadi, klik **Settings → Storage** → masukkan ISO Amazon Linux ke optical drive.
4. Nyalakan VM.
   - **Boot menu**: pilih *Install Amazon Linux 2023*.
   - Pilih bahasa English (US), keyboard, disk (hapus partisi lama → Use Entire Disk).
   - Pilih paket: **Minimal**/**Basic Server** (tanpa GUI).
   - Buat user `ec2-user` **+ password** (simpan baik-baik). Jangan tampilkan di video.
5. Setelah instalasi selesai, VM reboot → login:
   ```bash
   ec2-user
   <password>
   ```
6. Viral Networks (lihat [`netplan-static-ip.yaml.template`](netplan-static-ip.yaml.template)):
   ```bash
   ip -br addr                              # catat nama adapter
   sudo nmcli connection show                # (NetworkManager, .default AL2023)
   ```

### C.1 Set IP statis Host-Only (AL2023, pakai NetworkManager)

```bash
# contoh nama koneksi "hostonly" — sesuaikan dengan `nmcli connection show`
sudo nmcli connection add type ethernet ifname enp0s8 con-name hostonly ipv4.method manual ipv4.addresses 192.168.56.10/24
sudo nmcli connection up hostonly
sudo nmcli connection show hostonly | grep -E "ipv4\.(addresses|method)"
```

> **Fallback Ubuntu**: konfigurasi netplan lihat [`netplan-static-ip.yaml.template`](netplan-static-ip.yaml.template).

### C.2 Verifikasi

```bash
ip -br addr                        # harus ada 192.168.56.10
ping -c 3 192.168.56.1             # host-only OK
ping -c 3 8.8.8.8                  # internet via NAT OK
sudo systemctl status sshd         # SSH aktif
```

---

## D. Membuat VM-2 (Ubuntu Server 24.04 LTS) — opsional

1. New → Name `vm-worker-ubuntu`, Type Linux, Version Ubuntu (64-bit) → **Next** → ISO Ubuntu.
2. RAM 1536–2048 MB, CPU 1–2, Disk 20 GB.
3. Install: bahasa Inggris → keyboard → Network: biarkan adapter 1 (NAT) DHCP; LAN interface
   adapter 2 (Host-only) beri IP statis `192.168.56.20/24` (tandai static).
4. Storage: Use entire disk; Profile: nama `ubuntu`, server name `vm-worker-ubuntu`.
5. Ubuntu Server installer meminta **OpenSSH server** → **centang**.
6. Setelah reboot, login `ubuntu` → cek `ip -br addr`.

---

## E. Key pair RSA (emulasi Key Pair EC2)

Kerjakan di **WSL2** (sebagai "laptop admin"):

```bash
mkdir -p ~/.ssh && cd ~/.ssh
ssh-keygen -t rsa -b 4096 -f lab_ec2 -N ""    # private: lab_ec2, public: lab_ec2.pub
cat lab_ec2.pub                              # copy outputnya
```

Di VM (Amazon Linux / Ubuntu):

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ISI_KEY_LAB_EC2.PUB" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
# (SELinux / firewalld di AL2023)
sudo semanage fcontext -a -t ssh_home_t '~/.ssh/authorized_keys' 2>/dev/null || true
sudo restorecon -Rv ~/.ssh 2>/dev/null || true
sudo systemctl restart sshd
```

Login dari WSL2 / Windows:

```bash
chmod 600 ~/.ssh/lab_ec2
ssh -i ~/.ssh/lab_ec2 ec2-user@192.168.56.10
ssh -i ~/.ssh/lab_ec2 ubuntu@192.168.56.20
```

Di Windows PowerShell:

```powershell
icacls .\lab_ec2 /inheritance:r
icacls .\lab_ec2 /grant:r "$($env:USERNAME):(R)"
ssh -i .\lab_ec2 ec2-user@192.168.56.10
```

---

## F. Setelah VM siap

Masuk server dan jalankan:

```bash
# Amazon Linux 2023 (VM-1 / "EC2")
bash amazon-linux/setup-httpd.sh

# Ubuntu 24.04 (VM-2 / worker K8s)
bash ubuntu-k8s/setup-webserver.sh
```

Hasil: `curl http://192.168.56.10` dari host/WSL2 → halaman web server.
