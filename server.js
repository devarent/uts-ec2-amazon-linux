/* ============================================================
   server.js — Static file server yang AMAN untuk di-expose
   lewat port forwarding (bukan sekadar `node -e ...`).
   - Hanya melayani ekstensi publik (html/css/js/gambar/font)
   - Menolak dotfiles (.env, .git, ...), path traversal, backslash
   - Menolak folder aplikasi/infra (app/, db/, helm/, k8s/, dll.)
   Jalankan: node server.js   (listen 0.0.0.0:3001)
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 3001);

// Tipe file yang boleh diakses publik
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.map': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json'
};

// Folder yang TIDAK boleh diakses sama sekali (infra/kredensial/sumber internal)
const BLOCKED_DIRS = new Set([
  'app', 'db', 'helm', 'k8s', 'terraform', 'scripts', 'skrip', 'hosting',
  'backups', 'docs', 'LAB', 'assets-src', 'node_modules', '.git', '.github',
  'nginx', 'New folder', 'New folder (2)', 'UTS-EC2-WebHosting'
]);

function send(res, status, msg) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
  res.end(msg);
}

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    return send(res, 400, 'Bad request');
  }

  // Tolak backslash & null byte
  if (urlPath.includes('\\') || urlPath.includes('\0')) return send(res, 400, 'Bad request');

  const segments = urlPath.split('/').filter(Boolean);

  // Tolak segmen tersembunyi/dotfile (.env, .git, ...) dan traversal
  for (const s of segments) {
    if (s === '.' || s === '..' || s.startsWith('.')) return send(res, 403, 'Forbidden');
  }

  // Tolak folder internal (berdasarkan segmen pertama)
  if (segments.length && BLOCKED_DIRS.has(segments[0])) return send(res, 403, 'Forbidden');

  let filePath = path.normalize(path.join(ROOT, ...segments));

  // Pastikan tetap di dalam ROOT
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) return send(res, 403, 'Forbidden');

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, 'Not found');
    const ext = path.extname(filePath).toLowerCase();
    const type = TYPES[ext];
    if (!type) return send(res, 403, 'Forbidden'); // ekstensi tidak dikenal/non-publik
    res.writeHead(200, {
      'Content-Type': type,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=300'
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Server aman berjalan di http://0.0.0.0:' + PORT);
});
