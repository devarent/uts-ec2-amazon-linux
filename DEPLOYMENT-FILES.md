# Deployment Files Index

Semua file yang diperlukan untuk deployment ke cPanel hosting.

## Quick Start

1. **Pilih metode deployment:**
   - File Manager (manual) → `DEPLOY-CPANEL.md`
   - FTP Client → `README-DEPLOYMENT.md`
   - Command Line → `deploy-quick.bat` atau `deploy-quick.sh`

2. **Upload files:**
   - Core files: `index.html`, `knowledge.html`, `login.html`, `dashboard.html`
   - Config: `.htaccess`
   - Assets: `assets/` folder

3. **Setup SSL:**
   - AutoSSL di cPanel, atau
   - Cloudflare, atau
   - Let's Encrypt manual

4. **Test:**
   - `http://aryafatthurahman1.ac.id/`
   - `http://aryafatthurahman1.ac.id/knowledge.html`

---

## File Index

### Documentation

| File | Deskripsi | Kapan Digunakan |
|------|-----------|-----------------|
| `README.md` | Project documentation utama | Reference umum |
| `DEPLOYMENT-GUIDE.md` | Panduan deployment lengkap | Semua metode |
| `DEPLOY-CPANEL.md` | cPanel-specific guide | cPanel hosting |
| `README-DEPLOYMENT.md` | Deployment README | Quick reference |
| `DEPLOYMENT-CHECKLIST.md` | Checklist deployment | Pre/post deployment |
| `DEPLOYMENT-SUMMARY.md` | Ringkasan deployment | Quick overview |
| `DEPLOYMENT-FILES.md` | Index file ini | Navigation |

### Scripts

| File | Platform | Fungsi |
|------|----------|--------|
| `deploy-quick.bat` | Windows | Quick deployment via SCP |
| `deploy-quick.sh` | Linux/Mac | Quick deployment via SCP |
| `deploy-cpanel.bat` | Windows | Interactive deployment menu |
| `deploy-cpanel.sh` | Linux/Mac | Interactive deployment menu |
| `deploy-cpanel.ps1` | Windows | PowerShell deployment script |

### Configuration

| File | Fungsi |
|------|--------|
| `.htaccess` | Apache configuration untuk routing dan security |

### Core Files

| File | Fungsi |
|------|--------|
| `index.html` | Portofolio utama |
| `knowledge.html` | Knowledge base |
| `login.html` | Login page |
| `dashboard.html` | Dashboard workspace |

### Assets

| Folder/File | Fungsi |
|-------------|--------|
| `assets/css/style.css` | Main stylesheet |
| `assets/css/portal.css` | Portal stylesheet |
| `assets/js/main.js` | Main JavaScript |
| `assets/js/portal.js` | Portal JavaScript |
| `assets/js/ui.js` | UI utilities |
| `assets/img/favicon.svg` | Favicon |

---

## Deployment Workflow

### Step 1: Persiapan

- [ ] Pastikan semua file project ada
- [ ] Cek `.htaccess` configuration
- [ ] Verify assets folder structure

### Step 2: Pilih Metode

**File Manager:**
- Paling mudah untuk pemula
- Manual upload via web interface
- Lihat `DEPLOY-CPANEL.md`

**FTP Client:**
- Drag & drop interface
- Support resume upload
- Lihat `README-DEPLOYMENT.md`

**Command Line:**
- Cepat dan efisien
- Bisa automation
- Lihat `deploy-quick.bat` atau `deploy-quick.sh`

### Step 3: Upload

Upload semua file ke `/home/aryafatthur1/public_html/`

### Step 4: Permissions

- Files: `644`
- Folders: `755`

### Step 5: SSL Setup

- AutoSSL di cPanel, atau
- Cloudflare, atau
- Let's Encrypt manual

### Step 6: Testing

- Test semua pages
- Check browser console
- Test responsive design

---

## Server Information

- **IP**: 101.50.1.99
- **Domain**: aryafatthurahman1.ac.id
- **Username**: aryafatthur1
- **Home Directory**: /home/aryafatthur1/public_html
- **cPanel**: `https://aryafatthurahman1.ac.id:2083`

---

## URLs to Test

- `http://aryafatthurahman1.ac.id/` - Portofolio
- `http://aryafatthurahman1.ac.id/knowledge.html` - Knowledge Base
- `http://aryafatthurahman1.ac.id/login.html` - Login
- `http://aryafatthurahman1.ac.id/dashboard.html` - Dashboard

---

## Troubleshooting

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

## Quick Commands

### Windows (Batch)
```batch
deploy-quick.bat
```

### Linux/Mac (Bash)
```bash
chmod +x deploy-quick.sh
./deploy-quick.sh
```

### Manual SCP
```bash
scp index.html knowledge.html login.html dashboard.html .htaccess aryafatthur1@aryafatthurahman1.ac.id:/home/aryafatthur1/public_html/
scp -r assets aryafatthur1@aryafatthurahman1.ac.id:/home/aryafatthur1/public_html/
```

---

## Support

- **Documentation**: Lihat file `.md` di atas
- **Scripts**: Lihat file `.bat`, `.sh`, `.ps1` di atas
- **Configuration**: Lihat `.htaccess`
- **Core Files**: Lihat HTML files
- **Assets**: Lihat `assets/` folder

---

**Status**: Ready for Deployment ✅

**Last Updated**: 2026
