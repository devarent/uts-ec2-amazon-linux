# Deployment Checklist - cPanel Hosting

Gunakan checklist ini untuk memastikan deployment berhasil.

## Pre-Deployment

- [ ] Semua file project sudah siap
- [ ] File `.htaccess` sudah ada
- [ ] Folder `assets/` dengan subfolder `css/`, `js/`, `img/` sudah ada
- [ ] Tidak ada file sensitif (.env, secrets, dll)
- [ ] Semua HTML files valid
- [ ] CSS dan JS files tidak ada error

---

## Deployment Steps

### Metode 1: File Manager

- [ ] Login ke cPanel: `https://aryafatthurahman1.ac.id:2083`
- [ ] Buka File Manager
- [ ] Navigate ke `/home/aryafatthur1/public_html/`
- [ ] Upload `index.html`
- [ ] Upload `knowledge.html`
- [ ] Upload `login.html`
- [ ] Upload `dashboard.html`
- [ ] Upload `.htaccess`
- [ ] Upload folder `assets/` (css, js, img)
- [ ] Set permissions files: `644`
- [ ] Set permissions folders: `755`

### Metode 2: FTP

- [ ] Download FTP client (FileZilla/WinSCP)
- [ ] Konfigurasi FTP connection
- [ ] Connect ke server
- [ ] Navigate ke `/public_html/` folder
- [ ] Upload semua file
- [ ] Pastikan struktur folder benar
- [ ] Set permissions jika perlu

### Metode 3: SCP/SSH

- [ ] Jalankan script `deploy-cpanel.sh` atau `deploy-cpanel.bat`
- [ ] Atau manual SCP commands
- [ ] Upload semua file
- [ ] Upload assets folder
- [ ] Verify upload berhasil

---

## Post-Deployment

### File Verification

- [ ] `index.html` ada di `public_html/`
- [ ] `knowledge.html` ada di `public_html/`
- [ ] `login.html` ada di `public_html/`
- [ ] `dashboard.html` ada di `public_html/`
- [ ] `.htaccess` ada di `public_html/`
- [ ] `assets/` folder ada di `public_html/`
- [ ] `assets/css/` folder ada
- [ ] `assets/js/` folder ada
- [ ] `assets/img/` folder ada

### Permissions Check

- [ ] HTML files: `644`
- [ ] CSS files: `644`
- [ ] JS files: `644`
- [ ] Image files: `644`
- [ ] Folders: `755`
- [ ] `.htaccess`: `644`

### Website Testing

- [ ] Test `http://aryafatthurahman1.ac.id/` - Portofolio
- [ ] Test `http://aryafatthurahman1.ac.id/knowledge.html` - Knowledge Base
- [ ] Test `http://aryafatthurahman1.ac.id/login.html` - Login
- [ ] Test `http://aryafatthurahman1.ac.id/dashboard.html` - Dashboard
- [ ] Test `http://aryafatthurahman1.ac.id/assets/css/style.css` - CSS
- [ ] Test `http://aryafatthurahman1.ac.id/assets/js/main.js` - JS

### SSL Setup

- [ ] Jalankan AutoSSL di cPanel
- [ ] Atau setup Let's Encrypt manual
- [ ] Atau setup Cloudflare SSL
- [ ] Uncomment HTTPS redirect di `.htaccess`
- [ ] Test `https://aryafatthurahman1.ac.id/`

### Browser Testing

- [ ] Buka website di browser
- [ ] Check console untuk error (F12)
- [ ] Test responsive design (mobile/desktop)
- [ ] Test all interactive features
- [ ] Test navigation links
- [ ] Test forms (login, dashboard)
- [ ] Test modal dialogs
- [ ] Test toast notifications

---

## Troubleshooting

### Jika Website Tidak Accessible

- [ ] Cek file `index.html` ada di root
- [ ] Cek permissions file `644`, folder `755`
- [ ] Cek `.htaccess` syntax
- [ ] Cek error logs di cPanel
- [ ] Contact hosting support jika perlu

### Jika CSS/JS Tidak Load

- [ ] Cek path di HTML files
- [ ] Cek folder `assets/` ada
- [ ] Cek permissions assets folder
- [ ] Cek browser console untuk error
- [ ] Cek file names case-sensitive

### Jika SSL Tidak Aktif

- [ ] Jalankan AutoSSL di cPanel
- [ ] Atau gunakan Cloudflare
- [ ] Pastikan domain pointing ke IP yang benar
- [ ] Tunggu DNS propagation (bisa 24-48 jam)

---

## Final Checklist

- [ ] Semua file terupload dengan benar
- [ ] Permissions sudah benar
- [ ] Website accessible via browser
- [ ] Semua pages load dengan benar
- [ ] Assets load dengan benar
- [ ] Tidak ada error di browser console
- [ ] SSL certificate aktif (HTTPS)
- [ ] Mobile responsive berfungsi
- [ ] Semua fitur berfungsi dengan baik

---

## Notes

- **Domain**: aryafatthurahman1.ac.id
- **IP**: 101.50.1.99
- **Username**: aryafatthur1
- **Home Directory**: /home/aryafatthur1/public_html
- **Last Updated**: 2026

---

**Status**: Ready for Deployment ✅
