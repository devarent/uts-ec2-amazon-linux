#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gabungkan seluruh konfigurasi, skrip, dan panduan di folder proyek ini menjadi
satu dokumen Word (.docx) dan satu PDF (.pdf).

Kredensial / kata sandi / kunci privat sengaja TIDAK disertakan.
"""
from __future__ import annotations

import html
import re
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate,
    Spacer, Table, TableStyle, XPreformatted,
)

ROOT = Path(__file__).resolve().parent
DOCX_OUT = ROOT / "PANDUAN-LENGKAP-UTS-EC2.docx"
PDF_OUT = ROOT / "PANDUAN-LENGKAP-UTS-EC2.pdf"

# ---------------------------------------------------------------------------
# Daftar materi (urutan sesuai alur kerja). Duplikat folder UTS-EC2-WebHosting
# dilewati, kecuali file yang memang unik di sana.
# ---------------------------------------------------------------------------
SKIP_PARTS = (
    ".git", "node_modules", ".next", "koleksi", ".terraform",
)
SKIP_FILES = {
    ".env", "hosting/README.txt", "generate_documents.py", "create_pdf.py",
    "fw-log.txt", "hosts-log.txt", "pf-err.log", "pf-out.log",
}


def keep(rel: str) -> bool:
    r = rel.replace("\\", "/")
    if any(p in r for p in SKIP_PARTS):
        return False
    if r in SKIP_FILES:
        return False
    if r.endswith((".zip", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".woff", ".ttf")):
        return False
    # duplikat dari folder UTS-EC2-WebHosting (sudah ada di root)
    if r.startswith("UTS-EC2-WebHosting/"):
        inner = r[len("UTS-EC2-WebHosting/"):]
        if (ROOT / inner).exists():
            return False
        if inner.startswith(("docs/", "scripts/", "k8s/", "helm/", "terraform/", ".github/", "app/")):
            return False
    return True


def rel_exists(rel: str) -> bool:
    return (ROOT / rel).exists() and keep(rel)


SECTIONS: list[tuple[str, list[str]]] = []

SECTIONS.append(("Bagian 1. Ringkasan & Peta Materi", ["README.md"]))

SECTIONS.append(("Bagian 2. Panduan Deploy & Akses Server", [r for r in [
    "DEPLOYMENT-GUIDE.md", "DEPLOYMENT-COMPLETE.md", "DEPLOYMENT-SUMMARY.md",
    "DEPLOYMENT-FILES.md", "DEPLOYMENT-CHECKLIST.md", "README-DEPLOYMENT.md",
    "WSL2-PUTTY-GUIDE.md", "AKSES-PUTTY-WSL.md", "LAB-AL2023.md",
    "JAGOAN-UPLOAD-GUIDE.md", "DEPLOY-CPANEL.md", "NASKAH-VIDEO.md",
    "RDS_INTEGRATION_SUMMARY.md",
] if rel_exists(r)]))

SECTIONS.append(("Bagian 3. Dokumentasi Teknis (EC2 → Docker → Terraform → K8s → CI/CD)", [
    f"docs/{i:02d}-{n}.md" for i, n in enumerate([
        "ec2-launch", "docker-nginx", "domain-https", "terraform", "cicd",
        "kubernetes-helm", "troubleshooting", "aws-architecture-notes", "roadmap",
        "database", "rds-setup", "references", "aws-architecture-qanda",
        "nextjs-ai-production", "running-locally",
    ], start=1) if rel_exists(f"docs/{i:02d}-{n}.md")
] + (["docs/DATABASE_SETUP.md"] if rel_exists("docs/DATABASE_SETUP.md") else [])))

SECTIONS.append(("Bagian 4. Laboratorium Lokal (VMware/VirtualBox + WSL2)", [r for r in [
    "LAB/00-PANDUAN-UTAMA.md", "LAB/01-VM/README.md", "LAB/02-WSL2/README.md",
    "LAB/03-DOCKER/README.md", "LAB/04-TERRAFORM/README.md",
    "LAB/05-KUBERNETES/README.md", "LAB/06-SERVER/generate-server-info.sh",
    "LAB/07-STATUS-LAB.md", "LAB/skrip/cek-lab.sh",
    "LAB/skrip/wsl-fix-apache-docker.sh", "LAB/skrip/wsl-setup-site.sh",
    "LAB/01-VM/amazon-linux/setup-httpd.sh",
    "LAB/01-VM/ubuntu-k8s/setup-webserver.sh",
    "LAB/02-WSL2/install-tools.sh", "LAB/03-DOCKER/docker-compose.yml",
    "LAB/03-DOCKER/nginx.conf", "LAB/05-KUBERNETES/kind-cluster.yaml",
] if rel_exists(r)]))

APPENDIX_FILES = [r for r in [
    "docker-compose.yml", "docker-compose.rds.yml", ".env.example",
    "terraform/versions.tf", "terraform/variables.tf", "terraform/main.tf",
    "terraform/rds.tf", "terraform/dns.tf", "terraform/outputs.tf",
    "terraform/user-data.sh", "terraform/terraform.tfvars.example",
    "scripts/setup-ec2.sh", "scripts/setup-db.sh", "scripts/deploy.sh",
    "scripts/deploy-static.sh", "scripts/issue-cert.sh", "scripts/renew-cert.sh",
    "scripts/backup-db.sh", "scripts/restore-db.sh", "scripts/smoke-test.sh",
    "scripts/wsl2-bridge.sh", "scripts/docker-cleanup.sh",
    "scripts/set-aws-credentials.ps1",
    "add-firewall.ps1", "add-hosts.ps1", "Akses-PuTTY-WSL.bat",
    "skrip/setup-nginx.sh", "skrip/setup-apache2.sh",
    "skrip/setup-nginx-amazon-linux.sh", "skrip/deploy-nginx-amazon-linux.sh",
    "skrip/nginx-amazon-linux.conf", "skrip/cek-deploy.sh", "skrip/deploy.sh",
    "nginx/default.conf", "nginx/nginx.conf",
    "k8s/namespace.yaml", "k8s/configmap.yaml", "k8s/secret.example.yaml",
    "k8s/deployment.yaml", "k8s/service.yaml", "k8s/ingress.yaml",
    "k8s/hpa.yaml", "k8s/pdb.yaml", "k8s/kustomization.yaml",
    "helm/nextjs-app/Chart.yaml", "helm/nextjs-app/values.yaml",
    "helm/nextjs-app/README.md",
    ".github/workflows/ci.yml", ".github/workflows/deploy-ec2.yml",
    ".github/workflows/deploy-k8s.yml",
    "UTS-EC2-WebHosting/aws-deploy/README.md",
    "UTS-EC2-WebHosting/aws-deploy/deploy-site.sh",
    "UTS-EC2-WebHosting/aws-deploy/ansible/deploy-static-apache.yml",
    "UTS-EC2-WebHosting/aws-deploy/ansible/deploy-static-nginx.yml",
] if rel_exists(r)]
# templat Helm
for _p in sorted((ROOT / "helm/nextjs-app/templates").glob("*")):
    if _p.is_file() and _p.suffix in {".yaml", ".txt"}:
        APPENDIX_FILES.append(f"helm/nextjs-app/templates/{_p.name}")
SECTIONS.append(("Bagian 5. Lampiran Konfigurasi & Skrip", APPENDIX_FILES))

SECTIONS.append(("Bagian 6. Catatan Sesi Hosting, Domain, SSL & Database", ["__SESSION_NOTES__"]))

# ---------------------------------------------------------------------------
# Parser Markdown ringan
# ---------------------------------------------------------------------------
TOKEN_RE = re.compile(
    r"(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|~~[^~]+~~|\*[^*\n]+\*|!\[[^\]]*\]\([^)]+\))"
)
LIST_RE = re.compile(r"^(\s*)([-*+]|\d+\.)\s+(.*)$")
TABLE_SEP_RE = re.compile(r"^\s*\|?[\s:|-]+\|?\s*$")


def inline(text: str) -> list[tuple[str, str, str]]:
    """Kembalikan list (kind, value, extra). kind: text/b/code/link/i/s."""
    out: list[tuple[str, str, str]] = []
    pos = 0
    for m in TOKEN_RE.finditer(text):
        if m.start() > pos:
            out.append(("text", text[pos:m.start()], ""))
        tok = m.group(0)
        if tok.startswith("**"):
            out.append(("b", tok[2:-2], ""))
        elif tok.startswith("`"):
            out.append(("code", tok[1:-1], ""))
        elif tok.startswith("!["):
            mm = re.match(r"!\[([^\]]*)\]\(([^)]+)\)", tok)
            out.append(("i", f"[Gambar: {mm.group(1) or mm.group(2)}]" if mm else tok, ""))
        elif tok.startswith("["):
            mm = re.match(r"\[([^\]]+)\]\(([^)]+)\)", tok)
            if mm:
                out.append(("link", mm.group(1), mm.group(2)))
            else:
                out.append(("text", tok, ""))
        elif tok.startswith("~~"):
            out.append(("s", tok[2:-2], ""))
        else:
            out.append(("i", tok[1:-1], ""))
        pos = m.end()
    if pos < len(text):
        out.append(("text", text[pos:], ""))
    return out or [("text", "", "")]


def clean(text: str) -> str:
    text = re.sub(r"<br\s*/?>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    text = text.replace("&quot;", '"').replace("&#39;", "'")
    return text.strip()


def parse_markdown(src: str) -> list[tuple]:
    lines = src.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    blocks: list[tuple] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        s = line.strip()

        # code fence
        if s.startswith("```"):
            lang = s[3:].strip()
            i += 1
            buf: list[str] = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            blocks.append(("code", lang, "\n".join(buf).rstrip()))
            continue

        # heading
        m = re.match(r"^(#{1,6})\s+(.*)$", s)
        if m:
            blocks.append(("h", len(m.group(1)), clean(m.group(2))))
            i += 1
            continue

        # horizontal rule
        if re.fullmatch(r"(---+|\*\*\*+|___+)", s):
            blocks.append(("hr",))
            i += 1
            continue

        # table
        if s.startswith("|") and i + 1 < len(lines) and TABLE_SEP_RE.match(lines[i + 1]):
            header = [clean(c) for c in s.strip("|").split("|")]
            i += 2
            rows: list[list[str]] = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append([clean(c) for c in lines[i].strip().strip("|").split("|")])
                i += 1
            blocks.append(("table", header, rows))
            continue

        # blockquote
        if s.startswith(">"):
            buf = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip().lstrip(">").strip())
                i += 1
            blocks.append(("quote", clean(" ".join(buf))))
            continue

        # list
        m = LIST_RE.match(line)
        if m:
            items: list[tuple[int, str, str]] = []
            while i < len(lines):
                mm = LIST_RE.match(lines[i])
                if not mm:
                    if lines[i].strip() == "" and i + 1 < len(lines) and LIST_RE.match(lines[i + 1]):
                        i += 1
                        continue
                    break
                indent = len(mm.group(1)) // 2
                marker = mm.group(2)
                kind = "ol" if re.match(r"\d+\.", marker) else "ul"
                items.append((indent, kind, clean(mm.group(3))))
                i += 1
            blocks.append(("list", items))
            continue

        # paragraph
        if s:
            buf = [s]
            i += 1
            while i < len(lines):
                nxt = lines[i].strip()
                if (not nxt or nxt.startswith(("#", "```", ">", "|")) or
                        LIST_RE.match(lines[i]) or re.fullmatch(r"(---+|\*\*\*+|___+)", nxt)):
                    break
                buf.append(nxt)
                i += 1
            blocks.append(("p", clean(" ".join(buf))))
        else:
            i += 1
    return blocks


# ---------------------------------------------------------------------------
# SESI NOTES (dari catatan operasional terakhir; kredensial disensor)
# ---------------------------------------------------------------------------
SESSION_NOTES = r"""
# Catatan Sesi Hosting, Domain, SSL & Database

Catatan ini merangkum kejadian dan keputusan pada sesi operasional terakhir.
**Seluruh kata sandi, token, dan kunci privat sengaja disensor** dan tidak boleh
ditempelkan ke dalam laporan, video, maupun repositori publik.

## 1. Ringkasan pembelian

| Item | Keterangan |
| --- | --- |
| Penyedia | Jagoan Hosting Indonesia |
| Paket awal | Cloud Hosting Nextgen (ID ICON), siklus 3 bulan |
| Domain awal | `aryafathurhman1.ac.id` (status **Pending**, butuh dokumen) |
| Invoice | `#1801508`, tanggal 12 November 2026, status **PAID** |
| Total dibayar | Rp 137.640 |
| Domain aktif | `aryafathurhman1.my.id` (status **Active**, AutoSSL tervalidasi) |
| Shared IP | `101.50.1.99` |
| Home directory | `/home/aryafatthur1` |

> Domain `.ac.id` **tidak otomatis aktif** hanya karena pembayaran lunas.
> Untuk domain institusi/akademik, registrar mewajibkan **unggah dokumen
> persyaratan** (KTP/KTM, surat keterangan dari kampus, atau dokumen pendukung
> sesuai panduan registrar). Sementara itu, `.my.id` langsung aktif setelah
> pembayaran dan dapat dipakai untuk demonstrasi.

## 2. Masalah dan solusi yang ditemukan

### 2.1 Domain belum bisa dibuka (`DNS_PROBE_FINISHED_NXDOMAIN`)

Gejala: browser menampilkan *"This site can't be reached"* ketika membuka
domain yang masih **Pending**.

Penanganan:

1. Cek status domain di **Member Area → Domains**. Status harus **Active**.
2. Pastikan nameserver mengarah ke penyedia hosting, misalnya:
   - `best.jagoanhosting.com`
   - `great.jagoanhosting.com`
   - `one.jagoanhosting.com`
3. Tunggu propagasi DNS (hingga 24 jam).
4. Setelah aktif, buka kembali domain. Bila muncul halaman default
   **"SORRY!"**, itu berarti DNS sudah benar tetapi `public_html` masih kosong.

### 2.2 Halaman default "SORRY!" setelah domain aktif

Penyebab: belum ada file `index.html` di document root, atau Apache belum
mengarahkan virtual host ke folder yang benar.

Solusi:

- Unggah file statis ke `public_html` lewat **cPanel → File Manager** atau FTP.
- Pastikan file utama bernama `index.html`.
- Untuk aplikasi Next.js, **jangan** mengandalkan shared hosting (lihat 2.5).

### 2.3 Login cPanel "Login tidak valid"

Penyebab umum: memakai **email Member Area** sebagai username panel.
Keduanya adalah akun yang berbeda.

Langkah benar:

1. Buka panel hosting (URL dan username ada di email "Informasi Hosting").
2. Gunakan **username panel** (bukan email Member Area) dan kata sandi yang
   diberikan di email tersebut.
3. Setelah berhasil login, segera ganti kata sandi melalui
   **User → Password & Security**.
4. Gunakan kombinasi kuat: minimal 8–12 karakter, huruf besar, huruf kecil,
   angka, dan simbol. Sistem menolak kata sandi yang terlalu lemah.

> **Peringatan:** jangan pernah mengirim kata sandi ke chat, tiket, atau email
> dalam bentuk teks biasa. Gunakan saluran resmi dan ubah segera jika terbuka.

### 2.4 AutoSSL / sertifikat SSL

Status di **SSL/TLS Status**: `AutoSSL Domain Validated` untuk
`aryafathurhman1.my.id` dan subdomain standar (`autoconfig`, `autodiscover`,
`cpanel`, `cpcalendars`, dll.), berlaku hingga 10 Februari 2027.

Satu entri bermasalah:
`aryafathurhman1.my.id.aryafathurhman1.ac.id` → *"unmanaged"*. Ini adalah
subdomain hasil penggabungan dua domain yang tidak memang dipakai; cukup
diabaikan atau dihapus dari daftar SSL bila mengganggu.

### 2.5 phpMyAdmin: `#1044`, `#1046`, dan error tipe data

| Error | Arti | Solusi |
| --- | --- | --- |
| `#1044 Access denied` | User MySQL tidak boleh membuat database | Buat database lewat **cPanel → MySQL Databases**, bukan lewat SQL |
| `#1046 No database selected` | Belum ada database aktif | Pilih database di panel kiri atau jalankan `USE nama_database;` |
| `Type data tak dikenal (BIGINT/TIMESTAMP)` | Versi MySQL lama / query dump tidak cocok | Sesuaikan tipe data atau impor lewat cPanel |

**Kesimpulan penting:** paket hosting ini **PHP-only** (tidak ada menu
*Setup Node.js App*). Aplikasi **Next.js tidak bisa dijalankan di cPanel**
karena membutuhkan proses Node.js yang hidup terus. Pilihannya:

1. **EC2** — sesuai tugas UTS (wajib, memakai Public IP).
2. **Vercel** — alternatif cepat untuk demo, tanpa kartu kredit.

### 2.6 Deploy alternatif ke Vercel (cadangan, bukan pengganti UTS)

1. Login Vercel → **Add New → Project**.
2. Pilih repository GitHub yang sudah terhubung (branch `main`).
3. **Root Directory → `app`** (wajib, kalau tidak build akan gagal).
4. Framework: Next.js; Build command `npm run build`; Output `.next`.
5. Tambahkan environment variable yang dibutuhkan (`DATABASE_URL`, dll.).
6. Klik **Deploy**.

> Untuk UTS, tetap gunakan **AWS EC2 + Elastic IP**. Vercel/cPanel hanya
> cadangan bila demo needs alternatif; dosen menilai konfigurasi EC2,
> Security Group, SSH, web server, dan Public IP.

## 3. Daftar periksa akhir sebelum dikumpulkan

- [ ] EC2 berjalan dan memiliki **Public IPv4 / Elastic IP**.
- [ ] Security Group: port **22** dari IP sendiri, port **80/443** dari internet.
- [ ] Web server aktif: `systemctl status nginx` atau `apache2`.
- [ ] `http://PUBLIC_IP` menampilkan halaman dengan **nama & NIM**.
- [ ] Domain (opsional) mengarah ke Elastic IP via A record.
- [ ] SSL aktif bila memakai domain.
- [ ] Tidak ada kata sandi / access key / private key di video dan repositori.
- [ ] `terraform destroy` atau `terminate` setelah penilaian selesai.
"""


def read_source(rel: str) -> str:
    if rel == "__SESSION_NOTES__":
        return SESSION_NOTES
    p = ROOT / rel
    try:
        return p.read_text(encoding="utf-8", errors="replace")
    except OSError as exc:
        return f"> File tidak dapat dibaca: {rel} ({exc})"


# ---------------------------------------------------------------------------
# Renderer DOCX
# ---------------------------------------------------------------------------
def shade(paragraph, fill="F2F4F7"):
    pPr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    pPr.append(shd)


def set_cell_shading(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tcPr.append(shd)


def add_runs_docx(par, text: str, size=None):
    for kind, value, extra in inline(text):
        if not value:
            continue
        r = par.add_run(value)
        if kind == "b":
            r.bold = True
        elif kind == "i":
            r.italic = True
        elif kind == "s":
            r.font.strike = True
        elif kind == "code":
            r.font.name = "Consolas"
            r.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
            if size:
                r.font.size = Pt(size)
        elif kind == "link":
            r.font.color.rgb = RGBColor(0x05, 0x63, 0xC1)
            r.font.underline = True
    return par


def render_docx(specs: list[tuple[str, str, str]]) -> None:
    doc = Document()
    st = doc.styles["Normal"]
    st.font.name = "Arial"
    st.font.size = Pt(10.5)

    sec = doc.sections[0]
    sec.left_margin = Inches(0.8)
    sec.right_margin = Inches(0.8)
    sec.top_margin = Inches(0.8)
    sec.bottom_margin = Inches(0.7)

    # Cover
    for _ in range(4):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("PANDUAN LENGKAP\nDEPLOY & LAB CLOUD COMPUTING")
    r.bold = True
    r.font.size = Pt(26)
    r.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("AWS EC2 · Ubuntu · Amazon Linux 2023 · WSL2 · Docker · Terraform\n"
                  "Kubernetes · Helm · CI/CD · Domain & SSL · cPanel")
    r.font.size = Pt(13)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("\nUTS Ujian Tengah Semester — Kumpulan Konfigurasi, Skrip,\n"
                  "dan Catatan Operasional Lengkap")
    r.font.size = Pt(11)
    for _ in range(3):
        doc.add_paragraph()
    for line in [
        "Muhammad Arya Fatthurahman (2023230006)",
        "Muhammad Ibnu Ramadhan (2023230029)",
        "Sandi Yudha (2023230045)",
        "November 2026",
    ]:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run(line).font.size = Pt(11)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("\nCatatan: access key, private key, dan kata sandi hosting sengaja disensor.")
    r.italic = True
    r.font.size = Pt(9)
    doc.add_page_break()

    # Daftar isi
    h = doc.add_heading("Daftar Isi", level=1)
    h.runs[0].font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
    seen_sections: set[str] = set()
    for sec_title, rel, _src in specs:
        if sec_title not in seen_sections:
            seen_sections.add(sec_title)
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            add_runs_docx(p, f"**{sec_title}**")
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.3)
        p.paragraph_format.space_after = Pt(2)
        add_runs_docx(p, f"`{rel}`")
    doc.add_page_break()

    last_section = None
    for sec_title, rel, src in specs:
        if sec_title != last_section:
            last_section = sec_title
            h = doc.add_heading(sec_title, level=1)
            for r in h.runs:
                r.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
                r.font.size = Pt(18)

        # Judul file
        h = doc.add_heading(rel, level=2)
        for r in h.runs:
            r.font.size = Pt(13)
            r.font.color.rgb = RGBColor(0x44, 0x54, 0x6A)

        blocks = parse_markdown(src) if rel.endswith((".md", "__SESSION_NOTES__")) else [
            ("p", f"File konfigurasi: `{rel}`"), ("code", "text", src.rstrip())
        ]

        for b in blocks:
            k = b[0]
            if k == "h":
                level = min(max(b[1], 2), 5)
                p = doc.add_heading(b[2], level=level)
                for r in p.runs:
                    r.font.color.rgb = RGBColor(0x2E, 0x5E, 0x8C)
            elif k == "p":
                p = doc.add_paragraph()
                add_runs_docx(p, b[1])
            elif k == "quote":
                p = doc.add_paragraph()
                p.paragraph_format.left_indent = Inches(0.25)
                shade(p, "EEF4FB")
                add_runs_docx(p, b[1])
            elif k == "hr":
                p = doc.add_paragraph()
                pPr = p._p.get_or_add_pPr()
                pbdr = OxmlElement("w:pBdr")
                bottom = OxmlElement("w:bottom")
                bottom.set(qn("w:val"), "single")
                bottom.set(qn("w:sz"), "6")
                bottom.set(qn("w:color"), "AAAAAA")
                pbdr.append(bottom)
                pPr.append(pbdr)
            elif k == "code":
                p = doc.add_paragraph()
                p.paragraph_format.left_indent = Inches(0.15)
                p.paragraph_format.space_after = Pt(8)
                shade(p, "F4F4F4")
                for idx, ln in enumerate(b[2].split("\n")):
                    if idx:
                        p.add_run().add_break()
                    r = p.add_run(ln if ln else " ")
                    r.font.name = "Consolas"
                    r.font.size = Pt(8)
                    r.font.color.rgb = RGBColor(0x20, 0x20, 0x20)
            elif k == "list":
                for indent, kind, txt in b[1]:
                    style = "List Bullet" if kind == "ul" else "List Number"
                    p = doc.add_paragraph(style=style)
                    p.paragraph_format.left_indent = Inches(0.3 + 0.25 * indent)
                    p.paragraph_format.space_after = Pt(2)
                    add_runs_docx(p, txt)
            elif k == "table":
                header, rows = b[1], b[2]
                if not rows:
                    continue
                t = doc.add_table(rows=1, cols=len(header))
                t.style = "Table Grid"
                for j, cell_text in enumerate(header):
                    cell = t.rows[0].cells[j]
                    set_cell_shading(cell, "DCE6F1")
                    cell.text = ""
                    add_runs_docx(cell.paragraphs[0], f"**{cell_text}**")
                for row in rows:
                    cells = t.add_row().cells
                    for j, val in enumerate(row[:len(header)]):
                        cells[j].text = ""
                        add_runs_docx(cells[j].paragraphs[0], val)
                doc.add_paragraph()
        doc.add_page_break()

    doc.save(DOCX_OUT)
    print("DOCX:", DOCX_OUT)


# ---------------------------------------------------------------------------
# Renderer PDF
# ---------------------------------------------------------------------------
EMOJI_MAP = {
    "✅": "[OK]", "❌": "[X]", "⚠️": "[!]", "💡": "[Tips]", "🚀": ">",
    "🔒": "[SSL]", "📌": "*", "📦": "[pkg]", "🔥": "*", "🎯": "*",
    "👉": "->", "✔": "[OK]", "•": "-", "–": "-", "—": "-",
    "‘": "'", "’": "'", "“": '"', "”": '"',
}


def pdf_safe(text: str) -> str:
    for k, v in EMOJI_MAP.items():
        text = text.replace(k, v)
    return "".join(ch for ch in text if ord(ch) < 0x10000)


def render_inline_pdf(text: str) -> str:
    out = []
    for kind, value, extra in inline(pdf_safe(text)):
        v = html.escape(value)
        if kind == "b":
            out.append(f"<b>{v}</b>")
        elif kind == "i":
            out.append(f"<i>{v}</i>")
        elif kind == "s":
            out.append(f"<strike>{v}</strike>")
        elif kind == "code":
            out.append(f'<font face="Consolas" color="#1F4E79">{v}</font>')
        elif kind == "link":
            if extra.startswith(("http://", "https://", "mailto:")):
                out.append(f'<link href="{html.escape(extra, quote=True)}" color="#0563C1"><u>{v}</u></link>')
            else:
                out.append(v)
        else:
            out.append(v)
    return "".join(out)


def render_pdf(specs: list[tuple[str, str, str]]) -> None:
    for name, path, bold in [
        ("Arial", r"C:\Windows\Fonts\arial.ttf", False),
        ("Arial-Bold", r"C:\Windows\Fonts\arialbd.ttf", True),
        ("Consolas", r"C:\Windows\Fonts\consola.ttf", False),
        ("Consolas-Bold", r"C:\Windows\Fonts\consolab.ttf", True),
    ]:
        pdfmetrics.registerFont(TTFont(name, path))

    styles = getSampleStyleSheet()
    S = {
        "cover": ParagraphStyle("cover", parent=styles["Title"], fontName="Arial-Bold",
                                fontSize=24, leading=30, alignment=TA_CENTER,
                                textColor=colors.HexColor("#1F4E79"), spaceAfter=18),
        "cover_sub": ParagraphStyle("cover_sub", parent=styles["Normal"], fontName="Arial",
                                    fontSize=12, leading=18, alignment=TA_CENTER,
                                    textColor=colors.HexColor("#334155")),
        "h1": ParagraphStyle("h1", parent=styles["Heading1"], fontName="Arial-Bold",
                             fontSize=17, leading=22, textColor=colors.HexColor("#1F4E79"),
                             spaceBefore=14, spaceAfter=10),
        "h2": ParagraphStyle("h2", parent=styles["Heading2"], fontName="Arial-Bold",
                             fontSize=13, leading=17, textColor=colors.HexColor("#2E5E8C"),
                             spaceBefore=10, spaceAfter=6),
        "h3": ParagraphStyle("h3", parent=styles["Heading3"], fontName="Arial-Bold",
                             fontSize=11, leading=15, textColor=colors.HexColor("#2E5E8C"),
                             spaceBefore=8, spaceAfter=4),
        "body": ParagraphStyle("body", parent=styles["BodyText"], fontName="Arial",
                               fontSize=9.5, leading=13.5, alignment=TA_LEFT,
                               spaceAfter=5),
        "code": ParagraphStyle("code", parent=styles["Code"], fontName="Consolas",
                               fontSize=7.4, leading=9.2, backColor=colors.HexColor("#F4F4F4"),
                               borderColor=colors.HexColor("#DDDDDD"), borderWidth=0.5,
                               borderPadding=5, leftIndent=4, spaceAfter=7),
        "quote": ParagraphStyle("quote", parent=styles["BodyText"], fontName="Arial",
                                fontSize=9.3, leading=13, leftIndent=10, rightIndent=6,
                                backColor=colors.HexColor("#EEF4FB"), borderPadding=5,
                                borderColor=colors.HexColor("#B9D3EE"), borderWidth=0.5,
                                spaceAfter=6),
        "li": ParagraphStyle("li", parent=styles["BodyText"], fontName="Arial",
                             fontSize=9.3, leading=12.8, leftIndent=14, bulletIndent=4,
                             spaceAfter=2),
        "toc": ParagraphStyle("toc", parent=styles["BodyText"], fontName="Consolas",
                              fontSize=8.2, leading=11, leftIndent=14, spaceAfter=2),
        "cell": ParagraphStyle("cell", parent=styles["BodyText"], fontName="Arial",
                               fontSize=7.8, leading=10),
        "cellh": ParagraphStyle("cellh", parent=styles["BodyText"], fontName="Arial-Bold",
                                fontSize=7.8, leading=10, textColor=colors.HexColor("#1F4E79")),
    }

    def footer(canvas, doc_):
        canvas.saveState()
        canvas.setFont("Arial", 8)
        canvas.setFillColor(colors.HexColor("#666666"))
        canvas.drawString(18 * mm, 10 * mm, "Panduan Lengkap UTS EC2 — dikompilasi dari folder proyek")
        canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, f"Hal. {doc_.page}")
        canvas.restoreState()

    doc = SimpleDocTemplate(
        str(PDF_OUT), pagesize=A4,
        leftMargin=17 * mm, rightMargin=17 * mm,
        topMargin=16 * mm, bottomMargin=16 * mm,
        title="Panduan Lengkap UTS EC2", author="Muhammad Arya Fatthurahman",
    )
    story = []

    # Cover
    story.append(Spacer(1, 45 * mm))
    story.append(Paragraph("PANDUAN LENGKAP<br/>DEPLOY &amp; LAB CLOUD COMPUTING", S["cover"]))
    story.append(Paragraph(
        "AWS EC2 · Ubuntu · Amazon Linux 2023 · WSL2 · Docker · Terraform<br/>"
        "Kubernetes · Helm · CI/CD · Domain &amp; SSL · cPanel", S["cover_sub"]))
    story.append(Spacer(1, 20 * mm))
    story.append(Paragraph(
        "UTS Ujian Tengah Semester<br/>Kumpulan Konfigurasi, Skrip, dan Catatan Operasional Lengkap",
        S["cover_sub"]))
    story.append(Spacer(1, 25 * mm))
    story.append(Paragraph(
        "Muhammad Arya Fatthurahman (2023230006)<br/>"
        "Muhammad Ibnu Ramadhan (2023230029)<br/>"
        "Sandi Yudha (2023230045)<br/><br/>November 2026",
        S["cover_sub"]))
    story.append(Spacer(1, 12 * mm))
    story.append(Paragraph(
        "<i>Access key, private key, dan kata sandi hosting sengaja disensor.</i>", S["cover_sub"]))
    story.append(PageBreak())

    # TOC
    story.append(Paragraph("Daftar Isi", S["h1"]))
    seen: set[str] = set()
    for sec_title, rel, _src in specs:
        if sec_title not in seen:
            seen.add(sec_title)
            story.append(Paragraph("<b>" + html.escape(pdf_safe(sec_title)) + "</b>", S["body"]))
        story.append(Paragraph(pdf_safe(rel), S["toc"]))
    story.append(PageBreak())

    last_section = None
    for sec_title, rel, src in specs:
        if sec_title != last_section:
            last_section = sec_title
            story.append(Paragraph(pdf_safe(sec_title), S["h1"]))
        story.append(Paragraph(pdf_safe(rel), S["h2"]))

        blocks = parse_markdown(src) if rel.endswith((".md", "__SESSION_NOTES__")) else [
            ("p", f"File konfigurasi: `{rel}`"), ("code", "text", src.rstrip())
        ]

        for b in blocks:
            k = b[0]
            if k == "h":
                style = S["h3"] if b[1] >= 4 else S["h2"]
                story.append(Paragraph(render_inline_pdf(b[2]), style))
            elif k == "p":
                story.append(Paragraph(render_inline_pdf(b[1]), S["body"]))
            elif k == "quote":
                story.append(Paragraph(render_inline_pdf(b[1]), S["quote"]))
            elif k == "hr":
                story.append(HRFlowable(width="100%", thickness=0.6,
                                        color=colors.HexColor("#AAAAAA"),
                                        spaceBefore=4, spaceAfter=6))
            elif k == "code":
                story.append(XPreformatted(html.escape(pdf_safe(b[2])) or " ", S["code"]))
            elif k == "list":
                for indent, kind, txt in b[1]:
                    st_ = ParagraphStyle(
                        f"li{indent}", parent=S["li"], leftIndent=14 + 12 * indent,
                        bulletIndent=4 + 12 * indent,
                    )
                    bullet = "•" if kind == "ul" else "-"
                    story.append(Paragraph(
                        f"<font face='Arial'>{bullet}</font>&nbsp; {render_inline_pdf(txt)}", st_))
            elif k == "table":
                header, rows = b[1], b[2]
                if not rows:
                    continue
                data = [[Paragraph(render_inline_pdf(c), S["cellh"]) for c in header]]
                for row in rows:
                    data.append([Paragraph(render_inline_pdf(c), S["cell"])
                                 for c in row[:len(header)]])
                avail = A4[0] - 34 * mm
                colw = avail / len(header)
                t = Table(data, colWidths=[colw] * len(header), repeatRows=1, hAlign="LEFT")
                t.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#DCE6F1")),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#B0B8C4")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1),
                     [colors.white, colors.HexColor("#F7F9FC")]),
                ]))
                story.append(KeepTogether(t))
                story.append(Spacer(1, 6))
        story.append(PageBreak())

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print("PDF :", PDF_OUT)


def main() -> None:
    specs: list[tuple[str, str, str]] = []
    for sec_title, files in SECTIONS:
        for rel in files:
            specs.append((sec_title, rel, read_source(rel)))
    print(f"Total dokumen: {len(specs)} bagian")
    render_docx(specs)
    render_pdf(specs)
    print("Selesai.")


if __name__ == "__main__":
    main()
