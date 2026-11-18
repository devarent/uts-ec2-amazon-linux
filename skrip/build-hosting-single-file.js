#!/usr/bin/env node
/* ============================================================
   build-hosting-single-file.js
   ------------------------------------------------------------
   Membuat versi "satu file per halaman" dari portal UTS:
   - CSS  -> <style> inline (style.css + portal.css)
   - JS   -> <script> inline (main.js + portal.js)
   - foto & favicon -> data URI (base64)

   Tujuan: agar website tetap tampil sempurna di shared hosting
   (cPanel) walaupun folder assets/ belum ter-upload.

   Halaman yang dihasilkan (di folder hosting/):
     index.html      portofolio
     knowledge.html  knowledge base Cloud & DevOps
     login.html      gerbang login demo
     dashboard.html  workspace

   Pemakaian:
     node skrip/build-hosting-single-file.js
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'hosting');

const PAGES = ['index.html', 'knowledge.html', 'login.html', 'dashboard.html'];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function dataUri(rel, mime) {
  const buf = fs.readFileSync(path.join(ROOT, rel));
  return 'data:' + mime + ';base64,' + buf.toString('base64');
}

const CSS_FILES = ['assets/css/style.css', 'assets/css/portal.css'];
const JS_FILES = ['assets/js/main.js', 'assets/js/ui.js', 'assets/js/portal.js'];

const CSS = CSS_FILES.map(read);
const JS = JS_FILES.map(read);
const FAVICON = dataUri('assets/img/favicon.svg', 'image/svg+xml');
const PHOTO = dataUri('assets/img/foto-profil.jpg', 'image/jpeg');

function buildPage(file) {
  let html = read(file);

  /* 1. Inline favicon */
  html = html.replace(
    /<link rel="icon"[^>]*>/i,
    '<link rel="icon" type="image/svg+xml" href="' + FAVICON + '">'
  );

  /* 2. Inline seluruh stylesheet (satu <style> gabungan) */
  let firstCss = true;
  html = html.replace(/<link rel="stylesheet"[^>]*>/gi, function () {
    if (!firstCss) return '';
    firstCss = false;
    return '<style>\n' + CSS.map((css) => css.trim()).join('\n\n') + '\n</style>';
  });

  /* 3. Inline foto profil (hanya ada di index) */
  html = html.replace(/src="assets\/img\/foto-profil\.jpg"/g, 'src="' + PHOTO + '"');

  /* 4. Inline JS eksternal */
  let firstJs = true;
  html = html.replace(
    /<script src="assets\/js\/[a-z.-]+"><\/script>/gi,
    function () {
      if (!firstJs) return '';
      firstJs = false;
      return '<script>\n' + JS.map((js) => js.trim()).join('\n\n') + '\n</script>';
    }
  );

  /* 5. Dokumen .md tidak ikut ter-upload di hosting -> arahkan ke section HTML */
  html = html
    .replace(/href="WSL2-PUTTY-GUIDE\.md"/g, 'href="index.html#lab"')
    .replace(/href="README\.md"/g, 'href="index.html#architecture"')
    .replace(/href="NASKAH-VIDEO\.md"/g, 'href="index.html#cloud"');

  /* 6. Penanda versi build */
  html = html.replace(
    '<head>',
    '<head>\n  <!-- BUILD: single-file (hosting) — dibuat oleh skrip/build-hosting-single-file.js -->'
  );

  return html;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

let failed = false;
const report = [];

for (const page of PAGES) {
  const html = buildPage(page);
  const outFile = path.join(OUT_DIR, page);

  /* 7. Pastikan tidak ada sisa referensi file lokal pada atribut HTML */
  const leftovers = (html.match(/(src|href)="assets\/(css|js|img)\//g) || []).length;

  fs.writeFileSync(outFile, html, 'utf8');

  report.push({
    page,
    size: (Buffer.byteLength(html) / 1024).toFixed(1),
    leftovers
  });

  if (leftovers > 0) failed = true;
}

console.log('OK  -> hosting/ (' + PAGES.length + ' halaman)');
for (const row of report) {
  console.log(
    '    ' + row.page.padEnd(16) +
    row.size.padStart(7) + ' KB   sisa ref: ' + row.leftovers
  );
}

if (failed) {
  console.error('PERINGATAN: masih ada referensi ke folder assets/');
  process.exitCode = 1;
}
