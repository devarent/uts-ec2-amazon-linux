# Panduan Upload Website Static ke cPanel Jagoan (opsional — demo/public)

Website UTS ini adalah **website statis (HTML + CSS)**. Karena tugas utama menuntut **AWS EC2 + Public IP**, file ini adalah
siap di-*deploy* ke mana saja tanpa database.

## File yang sudah disiapkan

| File | Isi |
|---|---|
| `koleksi-uts-static-site.zip` | `index.html` + `assets/css/style.css` + `assets/img/*` + `assets/js/main.js` |

Lokasi: `C:\laragon\www\UTS Ujian Tengah Semester EC2 Amazon Linux\koleksi-uts-static-site.zip`

## Langkah Upload via cPanel

1. Buka browser → `https://wise.jagoanhosting.id:2083/cpsess.../frontend/jupiter/index.html` (login cPanel Jagoan).
2. Login → **File Manager**.
3. Buka folder **public_html**.
4. Klik **Upload** → pilih `koleksi-uts-static-site.zip` → tunggu selesai upload.
5. Klik kanan `koleksi-uts-static-site.zip` → **Extract**.
6. Setelah extract, pastikan ada: `index.html`, folder `assets/`.
7. Reload browser → `http://aryafatthurahman1.ac.id` (atau `http://<Shared IP>:2083`... lebih tepatnya domain utama).

## Hasil yang harus muncul

- Nama lengkap: **Muhammad Arya Fatthurahman**
- NIM: **2023230006**
- Kelas: **TIFM**
- Foto profil, About Me, Skills, Portofolio/Pengalaman, Kontak/Sosial.
- Akses via **Public IP** (server Jagoan: `101.50.1.99` — shared IP, bukan EC2 AWS).

## Catatan Penting

- Ini **bukan** pengganti AWS EC2 untuk penilaian UTS — tugas menuntut **AWS EC2 + Public IP + Apache2/Nginx + Security Group**.
- File ini **hanya untuk demonstrasi/public** agar website benar-benar bisa dilihat orang lain lewat IP publik.
- Tidak ada password/Access Key/Private Key yang disertakan dalam file ini.

## Alternatif Upload Manual (tanpa zip)

1. File Manager → public_html → **New File** → beri nama `index.html` → edit via HTML editor → paste isi file.
2. Buat folder `assets/` → `css/`, `img/`, `js/`, upload file masing-masing.

---

Kembali ke: `README.md` · `NASKAH-VIDEO.md` · `LAB/00-PANDUAN-UTAMA.md`
