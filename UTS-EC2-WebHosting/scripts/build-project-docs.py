#!/usr/bin/env python3
"""Membangun dokumentasi proyek dalam format DOCX dan HTML (untuk PDF).

Jalankan dari root proyek:
    python scripts/build-project-docs.py
"""

from __future__ import annotations

import html
import shutil
import subprocess
import tempfile
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "docs"
DOCX_PATH = OUT_DIR / "Panduan-UTS-Cloud-Computing.docx"
PDF_PATH = OUT_DIR / "Panduan-UTS-Cloud-Computing.pdf"

TITLE = "UTS Cloud Computing — AWS EC2"
SUBTITLE = "Panduan Lengkap: Next.js, PostgreSQL, Docker, Terraform, CI/CD — Deployment ke Public IP (Tugas UTS)"
DATE = "14 November 2026"

# ---------------------------------------------------------------------------
# Isi dokumen. Setiap blok: (jenis, ...)
#   h1/h2/h3, p, bullet, num, code, table (headers, rows), note, pagebreak
# ---------------------------------------------------------------------------

BLOCKS: list[tuple] = [
    ("h1", "1. Ringkasan Proyek"),
    ("p", "Dokumen ini merangkum cara membangun dan menjalankan proyek UTS Cloud Computing — AWS EC2 "
          "secara utuh: aplikasi Next.js + Tailwind CSS, database PostgreSQL, Docker Compose, "
          "Terraform, GitHub Actions, DNS, dan HTTPS. Semua perintah disesuaikan untuk Windows "
          "(CMD/PowerShell), bukan Linux."),
    ("p", "Stack yang dipakai:"),
    ("table", ["Lapisan", "Teknologi", "Keterangan"], [
        ["Frontend", "Next.js 16 + Tailwind CSS 4", "App Router, server-side API routes"],
        ["Backend", "Next.js Route Handlers", "REST: /api/health, /api/guestbook, /api/ai"],
        ["Database", "PostgreSQL 17", "Container sendiri, volume persisten"],
        ["Reverse proxy", "Nginx", "TLS termination, redirect 80 ke 443"],
        ["Container", "Docker + Compose v2", "App, db, adminer, nginx, certbot"],
        ["Infrastruktur", "Terraform (AWS provider v6)", "VPC, subnet, security group, EC2, EIP, Route 53"],
        ["CI/CD", "GitHub Actions", "Build image, push GHCR, deploy via SSH, health check, rollback"],
        ["Orkestrasi", "Kubernetes + Helm", "Deployment, Service, Ingress, HPA, chart Helm"],
    ]),
    ("h2", "1.1 Arsitektur"),
    ("code", "Internet\n"
             "  |  https://domain\n"
             "  v\n"
             "Route 53 (A record) -> Elastic IP\n"
             "  |\n"
             "  v\n"
             "EC2 (Debian 13, t3.micro)\n"
             "  +-- Docker network (internal)\n"
             "        +-- nginx     :443 / :80     <- satu-satunya port publik\n"
             "        +-- app       :3000          <- Next.js standalone, non-root\n"
             "        +-- db        :5432          <- PostgreSQL 17, volume db-data\n"
             "        +-- adminer   :8080          <- profil tools, loopback saja"),
    ("p", "Database berjalan sebagai container di dalam EC2 yang sama, bukan Amazon RDS. "
          "Karena itu database tidak akan terlihat di konsol RDS. Untuk melihat datanya, masuk "
          "lewat docker compose exec, Adminer via SSH tunnel, atau file backup harian."),
    ("note", "Penting: port 3000 dan 5432 tidak pernah dibuka ke internet. Security Group hanya "
             "mengizinkan 22 (dari IP kamu), 80, dan 443."),

    ("h1", "2. Prasyarat di Windows"),
    ("table", ["Alat", "Versi yang dipakai", "Cek dengan"], [
        ["Docker Desktop", "Compose v2", "docker --version"],
        ["Node.js", ">= 20.9", "node --version"],
        ["Git", "terbaru", "git --version"],
        ["Terraform", "1.16.x", "terraform version"],
        ["AWS CLI", "2.x", "aws --version"],
        ["OpenSSH", "bawaan Windows", "ssh -V"],
    ]),
    ("p", "Semua perintah dijalankan dari folder proyek:"),
    ("code", 'cd /d "C:\\laragon\\www\\UTS Cloud Computing — AWS EC2"'),
    ("note", "Jangan menjalankan perintah Linux seperti cp, chmod, atau /opt/app di CMD Windows. "
             "Perintah itu hanya berlaku setelah kamu SSH masuk ke EC2."),

    ("h1", "3. Menjalankan Proyek Secara Lokal"),
    ("h2", "3.1 Siapkan environment"),
    ("code", "copy .env.example .env\nnotepad .env"),
    ("p", "Nilai penting di .env:"),
    ("table", ["Variabel", "Contoh", "Fungsi"], [
        ["POSTGRES_DB", "ec2lab", "Nama database"],
        ["POSTGRES_USER", "ec2lab", "User database"],
        ["POSTGRES_PASSWORD", "ganti-password-kuat", "Ganti sebelum produksi"],
        ["ADMIN_TOKEN", "ganti-token-admin-acak", "Token untuk DELETE guestbook"],
        ["APP_BIND_IP", "127.0.0.1", "0.0.0.0 hanya untuk akses LAN"],
    ]),
    ("h2", "3.2 Jalankan app + database"),
    ("code", "docker compose up -d --build db app\ndocker compose ps"),
    ("p", "Container yang sehat akan terlihat seperti ini:"),
    ("code", "ec2-lab-app   Up (healthy)   127.0.0.1:3000->3000/tcp\n"
             "ec2-lab-db    Up (healthy)   5432/tcp"),
    ("h2", "3.3 Verifikasi"),
    ("code", "curl http://localhost:3000/api/health\n"
             "curl http://localhost:3000/api/guestbook"),
    ("p", "Health yang benar:"),
    ("code", '{"status":"ok","service":"uts-cloud-computing-ec2",'
             '"environment":"production","db":{"status":"up","latency_ms":4}}'),
    ("p", "Buka http://localhost:3000 lalu isi guestbook. Data harus tetap ada setelah refresh."),
    ("h2", "3.4 Adminer (opsional)"),
    ("code", "docker compose --profile tools up -d adminer"),
    ("table", ["Field", "Nilai"], [
        ["System", "PostgreSQL"],
        ["Server", "db"],
        ["Username", "ec2lab"],
        ["Password", "sesuai POSTGRES_PASSWORD"],
        ["Database", "ec2lab"],
    ]),
    ("note", "Di EC2, Adminer hanya listen di 127.0.0.1. Akses dari Windows lewat SSH tunnel: "
             "ssh -L 8090:127.0.0.1:8090 admin@IP-EC2"),

    ("h1", "4. Database PostgreSQL"),
    ("h2", "4.1 Tabel yang dibuat otomatis"),
    ("code", "guestbook                 app_users\n"
             "app_sessions              deployment_progress\n"
             "pipeline_configurations   database_configurations\n"
             "lab_section_configurations"),
    ("p", "Schema dibuat dua lapis: db/init/001-schema.sql dijalankan image PostgreSQL saat volume "
          "masih kosong, dan app/lib/db.ts menjalankan CREATE TABLE IF NOT EXISTS setiap start. "
          "Jadi database eksternal (misalnya Neon) juga otomatis siap."),
    ("h2", "4.2 Cek data"),
    ("code", 'docker compose exec db psql -U ec2lab -d ec2lab -c "\\dt"\n'
             'docker compose exec db psql -U ec2lab -d ec2lab -c "select * from guestbook;"'),
    ("h2", "4.3 Backup dan restore"),
    ("code", 'docker compose exec -T db pg_dump -U ec2lab -d ec2lab -Fc > backups\\manual.dump'),
    ("p", "Di EC2, backup berjalan otomatis tiap hari pukul 03:30 lewat cron yang dipasang "
          "scripts/setup-ec2.sh. Restore memakai scripts/restore-db.sh dengan konfirmasi."),
    ("note", "Menghapus container tidak menghapus data. Data hilang hanya jika volume dihapus: "
             "docker compose down -v."),

    ("h1", "5. Deploy ke AWS EC2"),
    ("h2", "5.1 Terraform"),
    ("p", "Konfigurasi sudah disiapkan di folder terraform/. File terraform.tfvars berisi region, "
          "IP SSH, dan public key."),
    ("code", 'cd terraform\n'
             'terraform init\n'
             'terraform plan -out tfplan\n'
             'terraform apply tfplan'),
    ("p", "Output penting setelah apply:"),
    ("table", ["Output", "Isi"], [
        ["public_ip", "Elastic IP, dipakai untuk A record"],
        ["instance_id", "ID EC2 untuk SSM"],
        ["ssh_command", "Contoh perintah SSH"],
        ["app_url / health_url", "URL aplikasi dan health check"],
    ]),
    ("h2", "5.2 Masuk ke EC2"),
    ("code", 'ssh -i C:\\Users\\aryaf\\.ssh\\ec2-lab admin@IP-ELASTIC'),
    ("h2", "5.3 Bootstrap dan deploy"),
    ("code", "sudo bash scripts/setup-ec2.sh\n"
             "cp .env.example .env\n"
             "nano .env\n"
             "docker compose up -d --build"),
    ("p", "setup-ec2.sh memasang Docker, Compose, swap 2 GB (penting untuk t3.micro), firewall "
          "ufw 22/80/443, serta cron backup dan cleanup."),
    ("h2", "5.4 DNS dan HTTPS"),
    ("p", "Arahkan A record (Route 53 atau Zone Editor registrar) ke Elastic IP, lalu terbitkan "
          "sertifikat:"),
    ("code", "DOMAIN=app.example.com EMAIL=kamu@example.com sudo -E bash scripts/issue-cert.sh"),
    ("p", "Certbot memperbarui sertifikat otomatis pada 02:30 dan 14:30. Nginx mengarahkan HTTP "
          "ke HTTPS dan meneruskan request ke app:3000."),
    ("note", "Tanpa akun AWS, langkah 5 tidak bisa dijalankan. Gunakan alternatif Vercel + Neon "
             "pada bagian 7."),

    ("h1", "6. CI/CD, Kubernetes, dan Helm"),
    ("h2", "6.1 GitHub Actions"),
    ("p", "Tiga workflow utama:"),
    ("table", ["Workflow", "Tugas"], [
        ["ci.yml", "Typecheck, build, smoke test app + PostgreSQL, CRUD guestbook"],
        ["deploy-ec2.yml", "Build image GHCR, deploy via SSH, health check, rollback"],
        ["Lainnya", "Validasi helm/k8s dan konfigurasi"],
    ]),
    ("p", "Secret yang dibutuhkan: EC2_HOST, EC2_USER, EC2_SSH_KEY. Image memakai GITHUB_TOKEN "
          "dengan permission packages: write."),
    ("h2", "6.2 Kubernetes + Helm"),
    ("code", "helm lint helm/nextjs-app\n"
             "helm template app helm/nextjs-app\n"
             "kubectl kustomize k8s\n"
             "kubectl apply -k k8s"),
    ("p", "Chart menyediakan Deployment, Service, Ingress, HPA, dan Secret opsional untuk "
          "DATABASE_URL. Database tidak dibundel di chart; gunakan PostgreSQL eksternal."),

    ("h1", "7. Alternatif Tanpa Akun AWS: Vercel + Neon"),
    ("p", "Jika tidak punya akun AWS, aplikasi tetap bisa online gratis. Vercel menjalankan "
          "Next.js, Neon menyediakan PostgreSQL. Keduanya punya paket gratis tanpa kartu."),
    ("h2", "7.1 Import ke Vercel"),
    ("num", "Buka vercel.com, daftar dengan GitHub."),
    ("num", "Add New > Project, import repo uts-cloud-computing-ec2."),
    ("num", "Ubah Root Directory menjadi app (wajib, karena package.json ada di app/)."),
    ("num", "Jangan deploy dulu; tambahkan database lebih dahulu."),
    ("h2", "7.2 Buat database Neon"),
    ("num", "Di halaman project, buka tab Storage > Create Database > Neon."),
    ("num", "Pilih region Singapore, plan Free, lalu Create dan Connect."),
    ("num", "Vercel menambahkan DATABASE_URL otomatis untuk Production, Preview, Development."),
    ("h2", "7.3 Environment variable tambahan"),
    ("table", ["Nama", "Nilai"], [
        ["DATABASE_URL", "otomatis dari Neon, harus mengandung sslmode=require"],
        ["ADMIN_TOKEN", "string acak 32 karakter untuk menghapus guestbook"],
        ["NEXT_PUBLIC_SITE_URL", "URL Vercel, opsional"],
    ]),
    ("p", "Generate token di CMD:"),
    ("code", "powershell -Command \"[guid]::NewGuid().ToString('N')\""),
    ("h2", "7.4 Deploy dan verifikasi"),
    ("p", "Klik Deploy, tunggu 2-3 menit, lalu buka:"),
    ("code", "https://NAMA-PROJECT.vercel.app/api/health\n"
             "https://NAMA-PROJECT.vercel.app/api/guestbook"),
    ("p", "Schema tidak perlu di-import. Request pertama ke guestbook akan membuat 7 tabel "
          "melalui app/lib/db.ts. Jika db.status down, periksa DATABASE_URL lalu Redeploy."),
    ("h2", "7.5 Domain sendiri"),
    ("num", "Vercel > Settings > Domains > Add, isi app.domainmu.com."),
    ("num", "Tambahkan CNAME app ke cname.vercel-dns.com di Zone Editor registrar."),
    ("num", "HTTPS diterbitkan otomatis oleh Vercel."),

    ("h1", "8. Troubleshooting"),
    ("table", ["Gejala", "Penyebab", "Solusi"], [
        ["InvalidClientTokenId", "AWS CLI memakai key contoh AKIAIOSFODNN7EXAMPLE", "Buat Access Key asli di IAM, jalankan aws configure"],
        ["The syntax of the command is incorrect", "Mengetik placeholder <...>; CMD membaca < sebagai redirection", "Ganti dengan nilai asli tanpa tanda kurung"],
        ["#1046 No database selected", "phpMyAdmin tidak punya database aktif", "Buat/pilih database dulu, atau pakai PostgreSQL"],
        ["Tipe data tak dikenal BIGSERIAL", "Schema PostgreSQL dijalankan di MySQL", "Gunakan db/mysql/001-schema-mysql.sql"],
        ["Port 5432 already in use", "PostgreSQL host lain berjalan", "Pakai 127.0.0.1:5433:5432"],
        ["next build gagal konek DB", "Build tidak boleh butuh database", "Pool dibuat lazy; jangan set REQUIRE_DB saat build"],
        ["Password DB tidak berubah", "Volume sudah ada, env hanya dipakai saat init", "ALTER ROLE atau hapus volume"],
        ["Health 503", "REQUIRE_DB=true dan database down", "docker compose ps, cek log db"],
    ]),
    ("note", "cPanel shared hosting tidak bisa menjalankan Next.js karena tidak menyediakan "
             "Node.js App. Jika menu Setup Node.js App tidak ada, gunakan Vercel atau EC2."),

    ("h1", "9. Checklist UTS"),
    ("bullet", "Aplikasi jalan lokal dan guestbook tersimpan di PostgreSQL."),
    ("bullet", "docker compose ps menunjukkan app dan db healthy."),
    ("bullet", "Security Group hanya membuka 22 (IP sendiri), 80, dan 443."),
    ("bullet", "Terraform plan bersih dan state tersimpan aman."),
    ("bullet", "Domain mengarah ke Elastic IP dan HTTPS valid."),
    ("bullet", "Backup harian berjalan dan restore sudah diuji."),
    ("bullet", "CI/CD hijau dan rollback otomatis terbukti."),
    ("bullet", "Budget alert AWS dipasang sebelum meninggalkan lab."),

    ("h1", "10. Referensi Perintah"),
    ("code", "# lokal\n"
             "docker compose up -d --build db app\n"
             "docker compose ps\n"
             "docker compose logs -f app\n"
             "docker compose exec db psql -U ec2lab -d ec2lab\n"
             "\n"
             "# terraform\n"
             "cd terraform\n"
             "terraform plan -out tfplan\n"
             "terraform apply tfplan\n"
             "terraform destroy\n"
             "\n"
             "# EC2\n"
             'ssh -i C:\\Users\\aryaf\\.ssh\\ec2-lab admin@IP\n'
             "sudo bash scripts/setup-ec2.sh\n"
             "docker compose up -d --build\n"),

    ("h1", "11. AWS Architecture Q&A (Part 2)"),
    ("p", "30 pertanyaan arsitektur production AWS yang paling sering ditanyakan, dikelompokkan "
          "ke 6 bagian. Versi lengkap tersedia di docs/13-aws-architecture-qanda.md."),
    ("table", ["Bagian", "Pertanyaan inti", "Kunci jawaban"], [
        ["Network & Security", "VPC vs subnet public/private; API Gateway vs ALB; WAF vs Shield; IAM Role vs Policy",
         "Private subnet tanpa public IP tidak bisa dijangkau internet; gateway = edge guard, ALB = traffic cop internal"],
        ["Compute & Microservices", "EC2 vs Fargate vs Lambda; cold start; rollout container",
         "Fargate = serverless compute; Lambda cold start dimitigasi Provisioned Concurrency; deploy via ECR + ECS task def"],
        ["Databases & Caching", "RDS vs DynamoDB; ElastiCache vs API Gateway cache",
         "RDS = ACID + SQL; DynamoDB = key-value skala masif; Redis = writable cache sub-milidetik"],
        ["Messaging & Event-Driven", "SNS+SQS vs Kafka vs EventBridge; Standard vs FIFO; Step Functions",
         "sns/sqs = decouple + tahan crash; FIFO = strict order; Step Functions = saga orchestration"],
        ["Storage & Frontend", "CSR/SSR/SSG/ISR; S3 storage classes; CloudFront; Route 53; PrivateLink",
         "SSR harus compute (bukan S3); lifecycle S3 hemat biaya; PrivateLink = tunnel privat ke AWS services"],
        ["DevOps & Observability", "Logs/Metrics/Traces; Sentry vs Grafana; Terraform/CDK; Multi-AZ vs Multi-Region",
         "3 pilar observability; Grafana = sistem, Sentry = kode; Multi-AZ dasar, Multi-Region untuk global/DR"],
    ]),
    ("h2", "11.1 Tujuh prinsip non-nego di production"),
    ("bullet", "Least privilege IAM - mulai dari nol, tambah izin hanya saat ada error AccessDenied."),
    ("bullet", "Database di private subnet; tidak ada port 5432 terbuka ke dunia."),
    ("bullet", "Semua secret di SSM Parameter Store / Secrets Manager, bukan di .env production."),
    ("bullet", "Multi-AZ (ALB + ECS + RDS Multi-AZ) sebelum bicara Multi-Region."),
    ("bullet", "State Terraform di S3 + DynamoDB lock untuk tim."),
    ("bullet", "Health check + auto-rollback di semua pipeline deploy."),
    ("bullet", "Tag semua resource; AWS Budgets ($1 & $5); destroy lab setelah selesai."),

    ("h1", "12. Next.js + AI: Dari Localhost ke Production"),
    ("p", "Arsitektur aplikasi di repo ini, lengkap dengan fitur AI hybrid. "
          "Versi lengkap: docs/14-nextjs-ai-production.md."),
    ("code", "User (browser)\n"
             "   |  https://app.example.com\n"
             "   v\n"
             "Nginx (TLS termination :443)\n"
             "   |  proxy_pass http://app:3000\n"
             "   v\n"
             "app (Next.js 16, container non-root)\n"
             "   |  /api/health  /api/guestbook  /api/ai  ...\n"
             "   v\n"
             "db (PostgreSQL 17, named volume)"),
    ("h2", "12.1 AI di aplikasi ini: hybrid knowledge base + LLM opsional"),
    ("bullet", "Local knowledge base (12 topik DevOps/AWS) - selalu aktif, gratis, offline."),
    ("bullet", "OpenAI Chat Completions jika OPENAI_API_KEY diisi - model default gpt-4o-mini, timeout 20 detik."),
    ("bullet", "Jika API gagal atau key kosong, respons otomatis dari KB lokal - fitur tidak pernah rusak."),
    ("note", "Verifikasi AI: POST /api/ai { message: \"kenapa port 3000 tidak dibuka?\" } - "
             "balasan memuat field source (openai atau local)."),
    ("h2", "12.2 Urutan deploy production (12 tahap)"),
    ("num", "Build aplikasi: npm run build - pastikan /api/health OK."),
    ("num", "Push kode ke GitHub (main)."),
    ("num", "Dockerfile multi-stage - image kecil, non-root, healthcheck /api/health."),
    ("num", "GitHub Actions: build & push image ke GHCR (tag sha-xxxx immutable)."),
    ("num", "EC2 t3.micro + Elastic IP; Docker + Compose lewat user-data.sh."),
    ("num", "Database: PostgreSQL container (lab) atau RDS (managed)."),
    ("num", "DNS: A record ke Elastic IP (Route 53 via Terraform atau registrar)."),
    ("num", "HTTPS: Certbot standalone + Nginx redirect 80 -> 443; renew otomatis 2x sehari."),
    ("num", "Monitoring: CloudWatch logs + Sentry (opsional) + health check eksternal."),
    ("num", "CI/CD deploy: SSH -> compose pull -> up -d -> polling /api/health -> rollback otomatis bila gagal."),
    ("num", "Optimasi biaya: free tier, Elastic IP idle, Budgets, tagging, terraform destroy."),
    ("num", "Verifikasi end-to-end: curl health, guestbook, dan /api/ai dari IP publik."),
    ("h2", "12.3 Verify and rollback (tempel ke dokumentasi deploy)"),
    ("code", "ssh admin@IP-EC2\n"
             "curl -s 127.0.0.1:3000/api/health\n"
             "curl -s https://app.example.com/api/health\n"
             "IMAGE_TAG=sha-abc1234 docker compose up -d   # rollback manual"),
]


# ---------------------------------------------------------------------------
# DOCX
# ---------------------------------------------------------------------------

FONT = "Segoe UI"
MONO = "Consolas"
ACCENT = RGBColor(0x1D, 0x4E, 0xD8)
DARK = RGBColor(0x0F, 0x17, 0x2A)
MUTED = RGBColor(0x47, 0x55, 0x69)


def shade_paragraph(paragraph, fill: str) -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    p_pr.append(shd)


def paragraph_border(paragraph, color: str, size: int = 18) -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = OxmlElement("w:pBdr")
    for side in ("top", "left", "bottom", "right"):
        element = OxmlElement(f"w:{side}")
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), str(size))
        element.set(qn("w:space"), "6")
        element.set(qn("w:color"), color)
        p_bdr.append(element)
    p_pr.append(p_bdr)


def shade_cell(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def add_page_number(paragraph) -> None:
    run = paragraph.add_run()
    fld_char_1 = OxmlElement("w:fldChar")
    fld_char_1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = "PAGE"
    fld_char_2 = OxmlElement("w:fldChar")
    fld_char_2.set(qn("w:fldCharType"), "end")
    run._r.append(fld_char_1)
    run._r.append(instr)
    run._r.append(fld_char_2)


def build_docx() -> None:
    document = Document()

    section = document.sections[0]
    section.page_width = Cm(21)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(2.2)
    section.bottom_margin = Cm(2.0)
    section.left_margin = Cm(2.2)
    section.right_margin = Cm(2.2)

    styles = document.styles
    normal = styles["Normal"]
    normal.font.name = FONT
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = DARK
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.25

    for name, size, color, before, after in (
        ("Heading 1", 18, ACCENT, 18, 8),
        ("Heading 2", 13, DARK, 14, 6),
        ("Heading 3", 11.5, MUTED, 10, 4),
    ):
        style = styles[name]
        style.font.name = FONT
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = color
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.keep_with_next = True

    # Footer dengan nomor halaman
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_run = footer.add_run("UTS Cloud Computing — AWS EC2  ·  ")
    footer_run.font.size = Pt(8)
    footer_run.font.color.rgb = MUTED
    add_page_number(footer)
    for run in footer.runs:
        run.font.size = Pt(8)
        run.font.color.rgb = MUTED

    # Cover
    spacer = document.add_paragraph()
    spacer.paragraph_format.space_before = Pt(90)

    kicker = document.add_paragraph()
    kicker_run = kicker.add_run("PANDUAN TEKNIS · BAHASA INDONESIA")
    kicker_run.font.size = Pt(9)
    kicker_run.font.bold = True
    kicker_run.font.color.rgb = ACCENT
    kicker.paragraph_format.space_after = Pt(10)

    title = document.add_paragraph()
    title_run = title.add_run(TITLE)
    title_run.font.size = Pt(30)
    title_run.font.bold = True
    title_run.font.color.rgb = DARK
    title.paragraph_format.space_after = Pt(8)

    subtitle = document.add_paragraph()
    subtitle_run = subtitle.add_run(SUBTITLE)
    subtitle_run.font.size = Pt(13)
    subtitle_run.font.color.rgb = MUTED
    subtitle.paragraph_format.space_after = Pt(28)

    rule = document.add_paragraph()
    paragraph_border(rule, "1D4ED8", 24)
    rule.paragraph_format.space_after = Pt(22)

    meta = document.add_paragraph()
    meta_run = meta.add_run(f"Disusun {DATE}  ·  Stack: Next.js, PostgreSQL, Docker, Terraform, Helm")
    meta_run.font.size = Pt(10)
    meta_run.font.color.rgb = MUTED

    document.add_page_break()

    # Daftar isi (manual, tanpa nomor halaman)
    document.add_heading("Daftar Isi", level=1)
    toc_items = [
        "1. Ringkasan Proyek",
        "2. Prasyarat di Windows",
        "3. Menjalankan Proyek Secara Lokal",
        "4. Database PostgreSQL",
        "5. Deploy ke AWS EC2",
        "6. CI/CD, Kubernetes, dan Helm",
        "7. Alternatif Tanpa Akun AWS: Vercel + Neon",
        "8. Troubleshooting",
        "9. Checklist UTS",
        "10. Referensi Perintah",
        "11. AWS Architecture Q&A (Part 2)",
        "12. Next.js + AI: Dari Localhost ke Production",
    ]
    for item in toc_items:
        paragraph = document.add_paragraph(item)
        paragraph.paragraph_format.space_after = Pt(4)

    document.add_page_break()

    first_h1 = True
    for block in BLOCKS:
        kind = block[0]

        if kind == "h1":
            if not first_h1:
                document.add_page_break()
            document.add_heading(block[1], level=1)
            first_h1 = False

        elif kind == "h2":
            document.add_heading(block[1], level=2)

        elif kind == "h3":
            document.add_heading(block[1], level=3)

        elif kind == "p":
            document.add_paragraph(block[1])

        elif kind == "bullet":
            paragraph = document.add_paragraph(block[1], style="List Bullet")
            paragraph.paragraph_format.space_after = Pt(3)

        elif kind == "num":
            paragraph = document.add_paragraph(block[1], style="List Number")
            paragraph.paragraph_format.space_after = Pt(3)

        elif kind == "code":
            paragraph = document.add_paragraph()
            paragraph.paragraph_format.space_before = Pt(4)
            paragraph.paragraph_format.space_after = Pt(10)
            paragraph.paragraph_format.left_indent = Cm(0.2)
            paragraph.paragraph_format.line_spacing = 1.05
            shade_paragraph(paragraph, "F1F5F9")
            paragraph_border(paragraph, "CBD5E1", 8)
            lines = block[1].split("\n")
            for index, line in enumerate(lines):
                run = paragraph.add_run(line)
                run.font.name = MONO
                run.font.size = Pt(8.5)
                run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
                if index < len(lines) - 1:
                    run.add_break()

        elif kind == "note":
            paragraph = document.add_paragraph()
            paragraph.paragraph_format.space_before = Pt(4)
            paragraph.paragraph_format.space_after = Pt(10)
            shade_paragraph(paragraph, "FEF3C7")
            paragraph_border(paragraph, "F59E0B", 12)
            label = paragraph.add_run("Catatan: ")
            label.font.bold = True
            label.font.size = Pt(9.5)
            label.font.color.rgb = RGBColor(0x92, 0x40, 0x0E)
            body = paragraph.add_run(block[1])
            body.font.size = Pt(9.5)
            body.font.color.rgb = RGBColor(0x78, 0x35, 0x0F)

        elif kind == "table":
            headers, rows = block[1], block[2]
            table = document.add_table(rows=1, cols=len(headers))
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            table.style = "Table Grid"
            table.autofit = True

            header_cells = table.rows[0].cells
            for index, header in enumerate(headers):
                cell = header_cells[index]
                cell.text = ""
                run = cell.paragraphs[0].add_run(header)
                run.font.bold = True
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                shade_cell(cell, "1E3A8A")

            for row_index, row in enumerate(rows):
                cells = table.add_row().cells
                for column_index, value in enumerate(row):
                    cell = cells[column_index]
                    cell.text = ""
                    run = cell.paragraphs[0].add_run(value)
                    run.font.size = Pt(9)
                    if row_index % 2 == 1:
                        shade_cell(cell, "F8FAFC")

            document.add_paragraph().paragraph_format.space_after = Pt(2)

        elif kind == "pagebreak":
            document.add_page_break()

    document.core_properties.title = TITLE
    document.core_properties.subject = "Panduan deployment Next.js + PostgreSQL di AWS EC2"
    document.core_properties.author = "AWS UTS Cloud Computing — AWS EC2"
    document.core_properties.language = "id-ID"

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    document.save(DOCX_PATH)


# ---------------------------------------------------------------------------
# HTML -> PDF (Chrome headless)
# ---------------------------------------------------------------------------

HTML_CSS = """
@page { size: A4; margin: 18mm 16mm 18mm 16mm; }
* { box-sizing: border-box; }
body {
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  color: #0f172a; font-size: 10.5pt; line-height: 1.55; margin: 0;
}
h1 {
  font-size: 18pt; color: #1d4ed8; margin: 26px 0 10px;
  padding-bottom: 6px; border-bottom: 2px solid #dbeafe;
  page-break-before: always; page-break-after: avoid;
}
h1:first-of-type { page-break-before: auto; }
h2 { font-size: 13pt; margin: 18px 0 6px; page-break-after: avoid; }
h3 { font-size: 11.5pt; color: #475569; margin: 14px 0 4px; page-break-after: avoid; }
p { margin: 6px 0; }
ul, ol { margin: 6px 0 10px 22px; padding: 0; }
li { margin: 3px 0; }
pre {
  font-family: Consolas, "Courier New", monospace; font-size: 8.6pt; line-height: 1.45;
  background: #f1f5f9; border: 1px solid #cbd5e1; border-left: 3px solid #1d4ed8;
  border-radius: 4px; padding: 10px 12px; white-space: pre-wrap;
  page-break-inside: avoid; margin: 8px 0 12px; color: #1e293b;
}
.note {
  background: #fef3c7; border: 1px solid #f59e0b; border-left: 4px solid #f59e0b;
  border-radius: 4px; padding: 9px 12px; font-size: 9.5pt; color: #78350f;
  page-break-inside: avoid; margin: 10px 0 12px;
}
.note strong { color: #92400e; }
table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 9pt; page-break-inside: avoid; }
th { background: #1e3a8a; color: #fff; text-align: left; padding: 7px 9px; font-weight: 600; }
td { border: 1px solid #dbe3ef; padding: 6px 9px; vertical-align: top; }
tr:nth-child(even) td { background: #f8fafc; }
.cover { height: 235mm; display: flex; flex-direction: column; justify-content: center; }
.cover .kicker { color: #1d4ed8; font-weight: 700; letter-spacing: .12em; font-size: 9pt; margin-bottom: 14px; }
.cover h1 { border: none; color: #0f172a; font-size: 30pt; line-height: 1.12; margin: 0 0 10px; page-break-before: auto; padding: 0; }
.cover .subtitle { color: #475569; font-size: 13pt; margin: 0 0 26px; }
.cover .rule { height: 3px; background: #1d4ed8; width: 100%; margin: 0 0 22px; }
.cover .meta { color: #64748b; font-size: 10pt; }
.toc { page-break-after: always; }
.toc p { margin: 5px 0; }
"""


def build_html(target: Path) -> None:
    parts: list[str] = []
    parts.append("<!doctype html><html lang='id'><head><meta charset='utf-8'>")
    parts.append(f"<title>{html.escape(TITLE)}</title>")
    parts.append(f"<style>{HTML_CSS}</style></head><body>")

    parts.append("<section class='cover'>")
    parts.append("<div class='kicker'>PANDUAN TEKNIS · BAHASA INDONESIA</div>")
    parts.append(f"<h1>{html.escape(TITLE)}</h1>")
    parts.append(f"<div class='subtitle'>{html.escape(SUBTITLE)}</div>")
    parts.append("<div class='rule'></div>")
    parts.append(f"<div class='meta'>Disusun {DATE} · Stack: Next.js, PostgreSQL, Docker, Terraform, Helm</div>")
    parts.append("</section>")

    parts.append("<section class='toc'><h1>Daftar Isi</h1>")
    for item in [
        "1. Ringkasan Proyek",
        "2. Prasyarat di Windows",
        "3. Menjalankan Proyek Secara Lokal",
        "4. Database PostgreSQL",
        "5. Deploy ke AWS EC2",
        "6. CI/CD, Kubernetes, dan Helm",
        "7. Alternatif Tanpa Akun AWS: Vercel + Neon",
        "8. Troubleshooting",
        "9. Checklist UTS",
        "10. Referensi Perintah",
        "11. AWS Architecture Q&A (Part 2)",
        "12. Next.js + AI: Dari Localhost ke Production",
    ]:
        parts.append(f"<p>{html.escape(item)}</p>")
    parts.append("</section>")

    list_open = False
    for block in BLOCKS:
        kind = block[0]
        if kind == "num":
            if not list_open:
                parts.append("<ol>")
                list_open = "ol"
        if kind == "bullet":
            if not list_open:
                parts.append("<ul>")
                list_open = "ul"
        if kind not in ("num", "bullet") and list_open:
            parts.append(f"</{list_open}>")
            list_open = False

        if kind == "h1":
            parts.append(f"<h1>{html.escape(block[1])}</h1>")
        elif kind == "h2":
            parts.append(f"<h2>{html.escape(block[1])}</h2>")
        elif kind == "h3":
            parts.append(f"<h3>{html.escape(block[1])}</h3>")
        elif kind == "p":
            parts.append(f"<p>{html.escape(block[1])}</p>")
        elif kind == "num":
            parts.append(f"<li>{html.escape(block[1])}</li>")
        elif kind == "bullet":
            parts.append(f"<li>{html.escape(block[1])}</li>")
        elif kind == "code":
            parts.append(f"<pre>{html.escape(block[1])}</pre>")
        elif kind == "note":
            parts.append(f"<div class='note'><strong>Catatan:</strong> {html.escape(block[1])}</div>")
        elif kind == "table":
            headers, rows = block[1], block[2]
            parts.append("<table><thead><tr>")
            for header in headers:
                parts.append(f"<th>{html.escape(header)}</th>")
            parts.append("</tr></thead><tbody>")
            for row in rows:
                parts.append("<tr>")
                for value in row:
                    parts.append(f"<td>{html.escape(value)}</td>")
                parts.append("</tr>")
            parts.append("</tbody></table>")
        elif kind == "pagebreak":
            parts.append("<div style='page-break-after: always'></div>")

    if list_open:
        parts.append(f"</{list_open}>")

    parts.append("</body></html>")
    target.write_text("".join(parts), encoding="utf-8")


def find_chrome() -> Path | None:
    candidates = [
        Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
        Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
        Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def build_pdf() -> None:
    chrome = find_chrome()
    if chrome is None:
        raise SystemExit("Chrome/Edge tidak ditemukan, PDF tidak bisa dibuat.")

    with tempfile.TemporaryDirectory(prefix="project-docs-") as temp_dir:
        temp = Path(temp_dir)
        html_path = temp / "guide.html"
        build_html(html_path)

        user_data = temp / "chrome-profile"
        command = [
            str(chrome),
            "--headless=new",
            "--disable-gpu",
            "--no-pdf-header-footer",
            "--no-sandbox",
            f"--user-data-dir={user_data}",
            f"--print-to-pdf={PDF_PATH}",
            html_path.as_uri(),
        ]
        result = subprocess.run(command, capture_output=True, text=True, timeout=180)
        if not PDF_PATH.exists():
            raise SystemExit(
                "Gagal membuat PDF.\n"
                f"stdout: {result.stdout}\nstderr: {result.stderr}"
            )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    build_docx()
    build_pdf()

    print(f"DOCX : {DOCX_PATH}  ({DOCX_PATH.stat().st_size / 1024:.0f} KB)")
    print(f"PDF  : {PDF_PATH}  ({PDF_PATH.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
