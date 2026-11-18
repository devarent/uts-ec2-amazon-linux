# Deployment Summary - cPanel Hosting

## Server Information

- **IP Publik**: 101.50.1.99
- **Username**: aryafatthur1
- **Domain**: aryafatthurahman1.ac.id
- **Home Directory**: /home/aryafatthur1/public_html
- **SSL**: Perlu diaktifkan

---

## Files yang Dibutuhkan

### Core Files
- ✅ `index.html` - Portofolio utama
- ✅ `knowledge.html` - Knowledge base
- ✅ `login.html` - Login page
- ✅ `dashboard.html` - Dashboard workspace
- ✅ `.htaccess` - Apache configuration

### Assets Folder
- ✅ `assets/css/style.css` - Main stylesheet
- ✅ `assets/css/portal.css` - Portal stylesheet
- ✅ `assets/js/main.js` - Main JavaScript
- ✅ `assets/js/portal.js` - Portal JavaScript
- ✅ `assets/js/ui.js` - UI utilities
- ✅ `assets/img/favicon.svg` - Favicon

### Documentation (Opsional)
- ✅ `README.md` - Project documentation
- ✅ `DEPLOYMENT-GUIDE.md` - Deployment guide
- ✅ `DEPLOY-CPANEL.md` - cPanel guide
- ✅ `README-DEPLOYMENT.md` - Deployment README
- ✅ `DEPLOYMENT-CHECKLIST.md` - Checklist

---

## Deployment Methods

### 1. File Manager (Recommended untuk pemula)

**Langkah:**
1. Login ke cPanel: `https://aryafatthurahman1.ac.id:2083`
2. Buka **File Manager**
3. Navigate ke `/home/aryafatthur1/public_html/`
4. Upload semua file
5. Set permissions: files `644`, folders `755`

**Pro:**
- Mudah untuk pemula
- Visual interface
- Tidak perlu install software

**Kontra:**
- Manual process
- Lambat untuk banyak file

---

### 2. FTP Client

**Software:**
- FileZilla (recommended)
- WinSCP
- Cyberduck

**Konfigurasi:**
```
Host: aryafatthurahman1.ac.id atau 101.50.1.99
Username: aryafatthur1
Password: [password hosting Anda]
Port: 21 (FTP) atau 22 (SFTP)
```

**Langkah:**
1. Connect ke server
2. Navigate ke `/public_html/` folder
3. Upload semua file
4. Pastikan struktur folder benar

**Pro:**
- Drag & drop interface
- Support multiple files
- Resume upload

**Kontra:**
- Perlu install software
- Manual process

---

### 3. SCP/SSH (Command Line)

**Windows:**
```batch
deploy-quick.bat
```

**Linux/Mac:**
```bash
chmod +x deploy-quick.sh
./deploy-quick.sh
```

**Manual SCP:**
```bash
# Upload files
scp index.html knowledge.html login.html dashboard.html .htaccess aryafatthur1@aryafatthurahman1.ac.id:/home/aryafatthur1/public_html/

# Upload assets folder
scp -r assets aryafatthur1@aryafatthurahman1.ac.id:/home/aryafatthur1/public_html/
```

**Pro:**
- Cepat dan efisien
- Command line automation
- Bisa script untuk automation

**Kontra:**
- Perlu SSH access
- Technical knowledge required

---

## SSL Setup

### Opsi 1: AutoSSL (Recommended)

1. Di cPanel, cari **SSL/TLS** atau **AutoSSL**
2. Klik **Run AutoSSL**
3. Tunggu beberapa menit
4. Uncomment HTTPS redirect di `.htaccess`

### Opsi 2: Let's Encrypt

1. Di cPanel, cari **SSL/TLS Wizard**
2. Pilih domain `aryafatthurahman1.ac.id`
3. Ikuti wizard
4. Install certificate

### Opsi 3: Cloudflare

1. Daftar di [Cloudflare.com](https://cloudflare.com)
2. Add domain `aryafatthurahman1.ac.id`
3. Ubah nameserver ke Cloudflare
4. Enable SSL di dashboard
5. Set SSL mode ke **Flexible** atau **Full**

---

## Testing

### URLs to Test

- `http://aryafatthurahman1.ac.id/` - Portofolio
- `http://aryafatthurahman1.ac.id/knowledge.html` - Knowledge Base
- `http://aryafathurahman1.ac.id/login.html` - Login
- `http://aryafatthurahman1.ac.id/dashboard.html` - Dashboard

### Assets to Test

- `http://aryafatthurahman1.ac.id/assets/css/style.css`
- `http://aryafatthurahman1.ac.id/assets/js/main.js`
- `http://aryafatthurahman1.ac.id/assets/img/favicon.svg`

---

## Troubleshooting

### 404 Not Found
- Pastikan `index.html` ada di root
- Cek `.htaccess` rewrite rules
- Cek permissions

### 403 Forbidden
- Cek permissions file/folder
- Cek `.htaccess` blocking
- Cek ownership

### CSS/JS tidak load
- Cek path di HTML files
- Pastikan `assets/` folder ada
- Cek browser console

### SSL tidak aktif
- Jalankan AutoSSL
- Atau gunakan Cloudflare
- Tunggu DNS propagation

---

## File Structure

```
public_html/
├── index.html
├── knowledge.html
├── login.html
├── dashboard.html
├── .htaccess
├── README.md
├── DEPLOYMENT-GUIDE.md
├── DEPLOY-CPANEL.md
├── README-DEPLOYMENT.md
├── DEPLOYMENT-CHECKLIST.md
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

## Quick Reference

### Permissions
- Files: `644`
- Folders: `755`
- `.htaccess`: `644`

### cPanel Access
- URL: `https://aryafatthurahman1.ac.id:2083`
- Username: `aryafatthur1`
- Password: [password hosting Anda]

### FTP Access
- Host: `aryafatthurahman1.ac.id` atau `101.50.1.99`
- Username: `aryafatthur1`
- Port: `21` (FTP) atau `22` (SFTP)

---

## Support

Jika ada masalah:

1. **Cek Error Logs**
   - cPanel > Metrics > Errors

2. **Cek Permissions**
   - Files: `644`
   - Folders: `755`

3. **Cek .htaccess**
   - Syntax validation
   - Apache logs

4. **Contact Support**
   - Hosting provider
   - Sertakan error messages

---

**Status**: Ready for Deployment ✅

**Last Updated**: 2026
