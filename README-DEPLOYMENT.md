# Deployment Guide - cPanel Hosting

Panduan lengkap untuk deploy website ke hosting cPanel Anda.

## Informasi Server

- **IP Publik**: 101.50.1.99
- **Username**: aryafatthur1
- **Domain**: aryafatthurahman1.ac.id
- **Home Directory**: /home/aryafatthur1
- **SSL**: Perlu diaktifkan

---

## File yang Dibutuhkan

### 1. File HTML
- `index.html` - Portofolio utama
- `knowledge.html` - Knowledge base
- `login.html` - Login page
- `dashboard.html` - Dashboard workspace

### 2. Folder Assets
- `assets/css/` - Stylesheet files
- `assets/js/` - JavaScript files
- `assets/img/` - Images dan icons

### 3. File Konfigurasi
- `.htaccess` - Apache configuration untuk routing dan security

### 4. File Dokumentasi (Opsional)
- `README.md` - Project documentation
- `DEPLOYMENT-GUIDE.md` - Deployment guide
- `DEPLOY-CPANEL.md` - cPanel deployment guide

---

## Metode Deployment

### Metode 1: File Manager (Paling Mudah)

1. **Akses cPanel**
   - Buka browser: `https://aryafatthurahman1.ac.id:2083`
   - Login dengan username dan password hosting

2. **Buka File Manager**
   - Cari **File Manager** di dashboard
   - Navigate ke `/home/aryafatthur1/public_html/`

3. **Upload File**
   - Klik **Upload** di toolbar
   - Upload semua file dari project
   - Pastikan folder `assets/` terupload dengan benar

4. **Set Permissions**
   - Files: `644`
   - Folders: `755`

### Metode 2: FTP Client

1. **Download FTP Client**
   - FileZilla (recommended)
   - WinSCP
   - Cyberduck

2. **Konfigurasi FTP**
   ```
   Host: aryafatthurahman1.ac.id atau 101.50.1.99
   Username: aryafatthur1
   Password: [password hosting Anda]
   Port: 21 (FTP) atau 22 (SFTP)
   ```

3. **Upload File**
   - Connect ke server
   - Navigate ke `/public_html/` folder
   - Upload semua file dari project

### Metode 3: SCP/SSH (Command Line)

1. **Jalankan Script**
   ```bash
   # Linux/Mac
   chmod +x deploy-cpanel.sh
   ./deploy-cpanel.sh
   
   # Windows
   deploy-cpanel.bat
   ```

2. **Atau Manual SCP**
   ```bash
   # Upload files
   scp index.html knowledge.html login.html dashboard.html .htaccess aryafatthur1@aryafatthurahman1.ac.id:/home/aryafatthur1/public_html/
   
   # Upload assets folder
   scp -r assets aryafatthur1@aryafatthurahman1.ac.id:/home/aryafatthur1/public_html/
   ```

---

## Struktur File yang Benar

```
public_html/
├── index.html
├── knowledge.html
├── login.html
├── dashboard.html
├── .htaccess
├── README.md (opsional)
├── DEPLOYMENT-GUIDE.md (opsional)
├── DEPLOY-CPANEL.md (opsional)
└── assets/
    ├── css/
    │   ├── style.css
    │   └── portal.css
    ├── js/
    │   ├── main.js
    │   ├── portal.js
    │   └── ui.js
    └── img/
        └── favicon.svg
```

---

## SSL Certificate Setup

### Opsi 1: AutoSSL (Recommended)

1. Di cPanel, cari **SSL/TLS** atau **AutoSSL**
2. Klik **Run AutoSSL**
3. Tunggu beberapa menit hingga certificate terinstall
4. Setelah aktif, uncomment HTTPS redirect di `.htaccess`

### Opsi 2: Let's Encrypt (Manual)

1. Di cPanel, cari **SSL/TLS Wizard**
2. Pilih domain `aryafatthurahman1.ac.id`
3. Ikuti wizard untuk generate certificate
4. Install certificate

### Opsi 3: Cloudflare (Free SSL)

1. Daftar di [Cloudflare.com](https://cloudflare.com)
2. Add domain `aryafatthurahman1.ac.id`
3. Ubah nameserver di domain registrar ke Cloudflare
4. Enable SSL di Cloudflare dashboard
5. Set SSL mode ke **Flexible** atau **Full**

---

## Testing Deployment

### 1. Test Basic Access

```bash
# Dari browser
http://aryafatthurahman1.ac.id
http://101.50.1.99

# Atau via curl
curl -I http://aryafatthurahman1.ac.id
curl -I http://101.50.1.99
```

### 2. Test Pages

- `http://aryafatthurahman1.ac.id/` - Portofolio
- `http://aryafatthurahman1.ac.id/knowledge.html` - Knowledge Base
- `http://aryafatthurahman1.ac.id/login.html` - Login
- `http://aryafatthurahman1.ac.id/dashboard.html` - Dashboard

### 3. Test Assets

- `http://aryafatthurahman1.ac.id/assets/css/style.css`
- `http://aryafatthurahman1.ac.id/assets/js/main.js`

---

## Troubleshooting

### Problem: 404 Not Found

**Solusi:**
- Pastikan file `index.html` ada di `public_html/`
- Cek `.htaccess` untuk rewrite rules
- Pastikan permissions file `644`, folder `755`

### Problem: 403 Forbidden

**Solusi:**
- Cek permissions folder/file
- Pastikan `.htaccess` tidak blocking
- Cek ownership file (harus `aryafatthur1`)

### Problem: CSS/JS tidak load

**Solusi:**
- Cek path di HTML files
- Pastikan folder `assets/` ada dan permissions benar
- Cek browser console untuk error

### Problem: SSL tidak aktif

**Solusi:**
- Jalankan AutoSSL di cPanel
- Atau gunakan Cloudflare untuk SSL gratis
- Pastikan domain sudah pointing ke IP yang benar

---

## File .htaccess

File `.htaccess` sudah disertakan dengan konfigurasi:

- ✅ Rewrite engine untuk clean URLs
- ✅ Security headers
- ✅ Cache static assets
- ✅ Gzip compression
- ✅ Deny access to sensitive files
- ✅ Prevent directory listing
- ✅ UTF-8 charset

**Catatan:** HTTPS redirect masih dikomentari. Uncomment setelah SSL aktif.

---

## Post-Deployment Checklist

- [ ] Semua file terupload dengan benar
- [ ] Permissions file `644`, folder `755`
- [ ] `.htaccess` terupload dan berfungsi
- [ ] Website accessible via browser
- [ ] SSL certificate aktif (HTTPS)
- [ ] Semua pages load dengan benar
- [ ] Assets (CSS/JS/images) load dengan benar
- [ ] Mobile responsive berfungsi
- [ ] Tidak ada error di browser console

---

## Support

Jika ada masalah:

1. **Cek Error Logs**
   - Di cPanel: **Metrics > Errors**
   - Atau: **Logs > Error Logs**

2. **Cek Permissions**
   - Files: `644`
   - Folders: `755`
   - Ownership: `aryafatthur1`

3. **Cek .htaccess**
   - Pastikan syntax benar
   - Cek error di Apache logs

4. **Contact Hosting Support**
   - Jika masalah persisten
   - Sertakan error messages dan screenshots

---

## Quick Commands (SSH - jika enabled)

```bash
# SSH ke server
ssh aryafatthur1@aryafatthurahman1.ac.id
# atau
ssh aryafatthur1@101.50.1.99

# Navigate ke public_html
cd /home/aryafatthur1/public_html

# List files
ls -la

# Check permissions
ls -la assets/

# Fix permissions
chmod 644 *.html
chmod 755 assets/
chmod 644 assets/css/*.css
chmod 644 assets/js/*.js
chmod 644 assets/img/*

# Test Apache config
sudo apachectl configtest
sudo systemctl reload apache2
```

---

## Additional Resources

- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - Panduan deployment lengkap
- [DEPLOY-CPANEL.md](DEPLOY-CPANEL.md) - cPanel-specific guide
- [README.md](README.md) - Project documentation

---

**Domain**: aryafatthurahman1.ac.id  
**IP**: 101.50.1.99  
**Username**: aryafatthur1  
**Last Updated**: 2026
