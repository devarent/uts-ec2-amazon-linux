# Deployment Guide - cPanel Hosting

## Informasi Server
- **IP Publik**: 101.50.1.99
- **Username**: aryafatthur1
- **Domain**: aryafatthurahman1.ac.id
- **Home Directory**: /home/aryafatthur1
- **SSL**: Perlu diaktifkan

---

## Metode 1: File Manager (Paling Mudah)

### Langkah 1: Akses cPanel
1. Buka browser dan akses: `https://aryafatthurahman1.ac.id:2083`
2. Login dengan username dan password hosting
3. Cari **File Manager** di dashboard

### Langkah 2: Upload File
1. Di File Manager, navigasi ke `/home/aryafatthur1/public_html/`
2. Hapus file default (index.html, dll) jika ada
3. Klik **Upload** di toolbar
4. Upload semua file dari folder project:
   - `index.html`
   - `knowledge.html`
   - `login.html`
   - `dashboard.html`
   - `assets/` folder (css, js, img)
   - `README.md` (opsional)
   - `DEPLOYMENT-GUIDE.md` (opsional)

### Langkah 3: Set Permissions
1. Klik kanan pada file/folder yang diupload
2. Pilih **Change Permissions**
3. Set ke `644` untuk files, `755` untuk folders
4. Untuk folder `assets`, pastikan permissions `755`

---

## Metode 2: FTP Client

### Setup FTP
1. Download FileZilla atau FTP client lain
2. Konfigurasi:
   - **Host**: `aryafatthurahman1.ac.id` atau `101.50.1.99`
   - **Username**: `aryafatthur1`
   - **Password**: Password hosting Anda
   - **Port**: `21` (FTP) atau `22` (SFTP)

### Upload File
1. Connect ke server
2. Navigate ke `/public_html/` folder
3. Upload semua file dari project
4. Pastikan struktur folder sama:
   ```
   public_html/
   ├── index.html
   ├── knowledge.html
   ├── login.html
   ├── dashboard.html
   ├── assets/
   │   ├── css/
   │   │   ├── style.css
   │   │   └── portal.css
   │   ├── js/
   │   │   ├── main.js
   │   │   ├── portal.js
   │   │   └── ui.js
   │   └── img/
   │       └── favicon.svg
   └── .htaccess (jika perlu)
   ```

---

## Metode 3: Git Deployment (Advanced)

### Setup Git di cPanel
1. Di cPanel, cari **Git Version Control**
2. Create new repository
3. Clone repository Anda
4. Set document root ke `public_html`

### Atau Manual Git
```bash
# Di server via SSH (jika enabled)
cd /home/aryafatthur1/public_html
git clone https://github.com/username/repo.git .
```

---

## File .htaccess (Penting untuk Routing)

Buat file `.htaccess` di root `public_html/`:

```apache
# Enable rewrite engine
RewriteEngine On

# Force HTTPS (setelah SSL aktif)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Remove trailing slash
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} (.+)/$
RewriteRule ^ %1 [L,R=301]

# Serve HTML files without extension
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.*)$ $1.html [L]

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json image/svg+xml
</IfModule>

# Deny access to sensitive files
<FilesMatch "^(\.htaccess|\.htpasswd|\.git|\.env|composer\.(json|lock)|package(-lock)?\.json)$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

---

## SSL Certificate Setup

### Opsi 1: AutoSSL (Recommended)
1. Di cPanel, cari **SSL/TLS** atau **AutoSSL**
2. Klik **Run AutoSSL**
3. Tunggu beberapa menit hingga certificate terinstall
4. Setelah aktif, aktifkan HTTPS redirect di `.htaccess`

### Opsi 2: Let's Encrypt (Manual)
1. Di cPanel, cari **SSL/TLS Wizard**
2. Pilih domain `aryafatthurahman1.ac.id`
3. Ikuti wizard untuk generate certificate
4. Install certificate

### Opsi 3: Cloudflare (Free SSL)
1. Daftar di Cloudflare.com
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

## File Structure yang Benar

```
public_html/
├── index.html
├── knowledge.html
├── login.html
├── dashboard.html
├── .htaccess
├── README.md (opsional)
├── DEPLOYMENT-GUIDE.md (opsional)
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
1. Cek error logs di cPanel: **Metrics > Errors**
2. Cek file permissions
3. Cek `.htaccess` syntax
4. Contact hosting support jika perlu

---

**Domain**: aryafatthurahman1.ac.id  
**IP**: 101.50.1.99  
**Username**: aryafatthur1  
**Last Updated**: 2026
