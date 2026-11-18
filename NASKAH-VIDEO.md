# NASKAH & OUTLINE VIDEO UTS — Cloud Computing

**Judul YouTube:** `UTS Cloud Computing - 2023230006 - Muhammad Arya Fatthurahman - TIFM`
**Durasi target:** 10–20 menit
**Format:** wajah terlihat (pembukaan, penjelasan, demonstrasi), suara sendiri, EC2 asli dengan Public IP.

> ⚠️ Lab lokal (VMware/VirtualBox, WSL2, Docker, Terraform, Kubernetes) adalah **alat bantu belajar**.
> **Demo yang dikumpulkan wajib memakai instance EC2 asli.** Di video, tunjukkan keduanya:
> lab Anda untuk menunjukkan pemahaman mendalam, lalu EC2 asli untuk bukti pengumpulan.

---

## Outline dengan alokasi waktu

### [0:00 – 1:00] Pembukaan — WAJAH TERLIHAT
- Salam + perkenalkan diri: *"Nama saya Muhammad Arya Fatthurahman, NIM 2023230006, Kelas TIFM, Prodi Teknologi Informasi, Universitas Darma Persada."*
- Sebutkan judul tugas: konfigurasi AWS EC2 & deployment website personal melalui Public IP.
- Tampilkan tujuan: EC2 → Security Group → SSH → Web Server → Website → Public IP.
- Perlihatkan website yang sudah online (screenshot Public IP) sebagai "teaser".

### [1:00 – 2:30] Gambaran arsitektur (slide 1 gambar)
- Diagram: Laptop → SSH → EC2 (Public IP) → Apache2 → /var/www/html → Browser.
- Jelaskan: AMI, Instance Type, Region, Key Pair, Security Group, VPC, subnet publik.
- **Penjelasan wajib — Public IP vs Private IP** (lihat tabel di README.md §2.5):
  - Private IP (`10.0.x.x`) → internal VPC saja.
  - Public IP (`54.x.x.x`) → dijangkau internet, dibatasi Security Group.

### [2:30 – 6:30] Demo Konfigurasi AWS EC2 (dari AWS Console)
Rekam layar langkah demi langkah, jelaskan tiap isian:
1. Pilih **Region** (mis. `us-east-1` / Singapore `ap-southeast-1`).
2. **Launch Instance** → Name `uts-web-aryaf` → **AMI Ubuntu Server 24.04 LTS** (atau Amazon Linux 2023).
3. **Instance Type** `t3.micro` — jelaskan Free Tier.
4. **Key Pair** — buat `uts-ec2-aryaf` (RSA .pem). **JANGAN tampilkan isi file key.**
5. **Network Settings** → buat **Security Group** `uts-ec2-sg-aryaf`:
   - Inbound **SSH / TCP / 22** → source `My IP` (atau `0.0.0.0/0` dengan penjelasan)
   - Inbound **HTTP / TCP / 80** → source `Anywhere`
   - Jelaskan aturan: hanya port yang dibutuhkan yang dibuka (principle of least privilege).
6. **Launch** → tunggu status **Running** → klik instance → catat **Public IPv4 address**.

### [6:30 – 9:30] Akses Server via SSH + Konfigurasi VPS
1. Tunjukkan **EC2 Instance Connect** (buka browser, klik Connect → EC2 Instance Connect).
2. Lalu tunjukkan juga **SSH dari PowerShell** (opsional tapi disarankan):
   ```powershell
   icacls .\uts-ec2-aryaf.pem /inheritance:r
   ssh -i .\uts-ec2-aryaf.pem ubuntu@<PUBLIC-IP>
   ```
3. Di dalam server:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y apache2
   sudo systemctl enable --now apache2
   sudo systemctl status apache2   # active (running)
   sudo ss -tlnp | grep :80
   ```
4. Jelaskan: apa itu `apt`, `systemctl`, `enable` vs `start`, port 22 vs 80, `www-data`.

### [9:30 – 13:00] Upload Website + Permission
1. Tunjukkan struktur folder proyek di laptop (`index.html`, `assets/…`, `skrip/…`).
2. Upload:
   ```powershell
   scp -i .\uts-ec2-aryaf.pem -r "<folder proyek>" ubuntu@<PUBLIC-IP>:/home/ubuntu/website
   ```
   (atau WinSCP/FileZilla — tampilkan seraya jelaskan)
3. Di server:
   ```bash
   sudo cp -r ~/website/* /var/www/html/
   sudo chown -R www-data:www-data /var/www/html
   sudo chmod -R 755 /var/www/html
   sudo systemctl reload apache2
   ```
4. Jelaskan permission: `755` folder, `644` file, owner `www-data`; kenapa perlu `sudo`.
5. Tunjukkan isi HTML: nama lengkap & NIM 2023230006 di bagian atas — **tunjuk langsung**.

### [13:00 – 15:30] Demo Website via PUBLIC IP (BUKAN localhost) — WAJIB
1. Buka browser → `http://<PUBLIC-IP>` → tampilkan:
   - Nama & NIM terlihat di hero/header, foto profil tampil.
   - Badge "Live" menunjukkan host publik yang sedang dipakai (bukan localhost).
2. Buka menu: Tentang Saya, Keahlian, Portofolio, Pengalaman, Sertifikasi, Kontak.
3. Buka **Knowledge** → tunjukkan roadmap 7 tahap, 17 modul DevOps, 30 topik AWS,
   dan bagian EC2/Docker/Terraform/CI-CD/troubleshooting. Jelaskan bahwa ini lampiran teknis
   dari tugas, bukan halaman tempelan.
4. Klik **Masuk** → login dengan akun demo (`arya@unsada.ac.id` / `uts2026`):
   - tunjukkan halaman login dan pesan bahwa sesi hanya disimpan di browser;
   - masuk ke workspace, lalu tunjukkan kartu "Host publik" berisi IP EC2;
   - centang 1–2 langkah checklist, ubah pilihan pipeline, kirim satu pesan guestbook;
   - refresh halaman → tunjukkan data tetap tersimpan;
   - buka **Status deploy** → tunjukkan `curl` ke IP publik dari terminal.
5. Buka juga dari **HP (jaringan seluler)** → bukti akses dari jaringan lain.
6. Dari server: `curl -I http://192.168.100.3` (200 OK) dan `curl -s http://192.168.100.3 | grep 2023230006`.

### [15:30 – 17:30] Bonus DevOps (nilai plus, opsional tapi mengesankan)
Tunjukkan bahwa Anda paham lebih dari yang diminta:
- **Docker**: `docker build -t uts-web -f LAB/03-DOCKER/Dockerfile .` → `docker run -p 8080:80` → browser.
- **Kubernetes (kind)**: `kind create cluster` → `kubectl apply -k LAB/05-KUBERNETES/manifests/`
  → `kubectl -n uts get pods -o wide` → `curl http://192.168.100.3:8080`.
- **Terraform**: `terraform plan` → tunjukkan apa yang *akan* dibuat; lalu `terraform destroy`.
- **VMware/VirtualBox**: VM Amazon Linux/Ubuntu + `http://192.168.56.10` (mode belajar lokal).
- Jelaskan alurnya: *"cara ini saya pakai untuk latihan; deployment UTS dilakukan di EC2 asli."*

### [17:30 – 19:00] Pengujian & Checklist
Jalankan dan tunjukkan:
```bash
bash skrip/cek-deploy.sh <PUBLIC-IP>
```
Atau sebutkan: instance Running, SG 22/80, HTTP 200 OK, nama & NIM tampil, bisa dari jaringan lain.

### [19:00 – 20:00] Penutup
- Ringkas 5 langkah besar tugas.
- Catatan biaya: "Setelah penilaian, instance akan saya **stop/terminate** agar tidak ada biaya."
- Peringatan: tidak ada password/access key/private key yang ditampilkan.
- Terima kasih + info pengumpulan EdLink (link YouTube, format Nama/NIM/Kelas).

---

## Tips Rekaman
- Resolusi 1080p, mic jelas, pencahayaan baik; wajah terlihat di awal & akhir setiap bagian.
- Gunakan OBS Studio / Xbox Game Bar (`Win+G`) / Loom.
- Tutup tab berisi key pair, file `.pem`, console admin dengan credential.
- Slow down: bicara sambil menunjukkan — itu yang dinilai dosen.
- Jika salah, potong/zoom saat editing atau rekam ulang segmen tersebut.
- Upload dengan visibilitas **Public/Unlisted**, judul sesuai format, dan **Public IP di deskripsi**.

## Checklist Sebelum Upload
- [ ] Wajah terlihat di pembukaan, penjelasan, demonstrasi
- [ ] Alur EC2 → SG → SSH → Web server → Deploy → Public IP terekam
- [ ] Browser membuka `http://<PUBLIC-IP>`, bukan `localhost`
- [ ] Nama & NIM jelas di website
- [ ] Durasi 10–20 menit
- [ ] Deskripsi video berisi Public IP + format EdLink
- [ ] Tidak ada credential/private key tampil
