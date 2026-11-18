CARA UPLOAD KE cPANEL (JAGOAN HOSTING)
=====================================
Muhammad Arya Fatthurahman - 2023230006 - TIFM
UTS Cloud Computing

Folder ini berisi EMPAT halaman versi SATU FILE:
  index.html      -> portofolio
  knowledge.html  -> knowledge base Cloud & DevOps
  login.html      -> login demo
  dashboard.html  -> workspace

CSS, JavaScript, ikon, dan foto profil sudah ditanam (base64)
di dalam masing-masing HTML. Jadi TIDAK butuh folder assets/.


LANGKAH (5 menit)
-----------------
1. Login cPanel -> File Manager
2. Masuk ke folder:  aryafatthurahman1.my.id
3. Upload KEEMPAT file .html dari folder hosting/ ini
   (index.html, knowledge.html, login.html, dashboard.html)
4. Jika muncul konfirmasi "overwrite index.html?" -> pilih YES
5. Buka http://aryafatthurahman1.my.id (tekan Ctrl+F5)
6. Tes menu "Knowledge" dan tombol "Masuk"

Akun demo login:
  Email    : arya@unsada.ac.id
  Password : uts2026


STRUKTUR AKHIR DI cPANEL
------------------------
  aryafatthurahman1.my.id/
  |-- index.html
  |-- knowledge.html
  |-- login.html
  `-- dashboard.html

Kalau hanya mengunggah index.html, halaman lain akan 404
saat menu Knowledge atau Masuk diklik.


OPSIONAL - struktur multi-file (seperti di EC2)
-----------------------------------------------
Upload juga index.html + knowledge.html + login.html +
dashboard.html + folder assets/ dari paket utama. Struktur:

  aryafatthurahman1.my.id/
  |-- index.html
  |-- knowledge.html
  |-- login.html
  |-- dashboard.html
  `-- assets/
      |-- css/style.css
      |-- css/portal.css
      |-- img/foto-profil.jpg
      |-- img/favicon.svg
      |-- js/main.js
      `-- js/portal.js


CATATAN LOGIN
-------------
Login ini adalah gerbang demonstrasi untuk UTS, bukan sistem
autentikasi produksi. Sesi disimpan di localStorage browser
(hanya di perangkat pengunjung). Tidak ada password yang dikirim
ke server dan tidak ada database yang dibutuhkan.


KALAU MASIH TAMPIL TANPA WARNA
------------------------------
Penyebab paling umum: file CSS tidak ikut ter-upload.
Cek langsung di browser:
  http://aryafatthurahman1.my.id/assets/css/style.css
- Muncul kode CSS  -> folder assets sudah benar
- Muncul 404       -> folder assets belum ada, pakai versi satu file ini
