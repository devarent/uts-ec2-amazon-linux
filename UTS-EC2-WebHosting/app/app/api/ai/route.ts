import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { message?: unknown };

const knowledge: Array<{ match: RegExp; reply: string }> = [
  {
    match: /(port\s*3000|3000)/i,
    reply:
      "Port 3000 adalah port internal container. Di produksi, hanya Nginx yang menghadap internet (80/443), lalu proxy_pass ke app:3000 lewat Docker network. Membuka 3000 ke 0.0.0.0/0 berarti bypass TLS, rate limit, dan security header — jangan dilakukan.\n\nCek: docker compose ps (port harus 127.0.0.1:3000 atau tidak dipublish sama sekali).",
  },
  {
    match: /(elastic\s*ip|eip|public\s*ipv4)/i,
    reply:
      "Public IPv4 biasa bisa berubah saat instance di-stop/start, sehingga DNS jadi rusak. Elastic IP adalah alamat statis milik akunmu yang bisa di-associate ulang. Karena sejak 2024 Elastic IP dikenakan biaya kecil saat idle, lepaskan (release) kalau lab sudah selesai.\n\nTerraform: aws_eip + aws_eip_association, output public_ip dipakai untuk A record.",
  },
  {
    match: /(multi.?stage|dockerfile|image\s*size)/i,
    reply:
      "Multi-stage build memisahkan dependency + compiler dari runtime. Stage builder menjalankan npm ci dan next build; stage runner hanya menyalin .next/standalone, .next/static, dan public. Hasilnya image jauh lebih kecil, tanpa devDependencies, dan container jalan sebagai user non-root (UID 1001).\n\nTambahkan HEALTHCHECK ke /api/health supaya orchestrator tahu kapan container siap.",
  },
  {
    match: /(rollback|kembali|gagal\s*deploy)/i,
    reply:
      "Pipeline menyimpan image digest/tag sebelumnya, pull image baru, lalu polling /api/health (mis. 30x tiap 2 detik). Kalau tidak sehat: compose down, set image ke tag sebelumnya, up lagi, dan job exit 1. Kuncinya: selalu deploy dengan tag immutable (sha-xxxx), bukan hanya latest.\n\nManual: IMAGE_TAG=sha-abc1234 docker compose up -d.",
  },
  {
    match: /(https|ssl|tls|certbot|let'?s\s*encrypt)/i,
    reply:
      "Alurnya: A record domain → Elastic IP, pastikan port 80 reachable, lalu Certbot (webroot atau standalone) menerbitkan sertifikat. Nginx memakai fullchain.pem + privkey.pem dan mengarahkan 80 → 443. Perpanjangan: systemd timer/cron dua kali sehari dengan certbot renew --deploy-hook 'docker compose exec nginx nginx -s reload'.\n\nUji: curl -I https://domainmu dan cek masa berlaku: openssl s_client -connect domain:443 -servername domain </dev/null 2>/dev/null | openssl x509 -noout -dates",
  },
  {
    match: /(security\s*group|firewall|ssh|port\s*22)/i,
    reply:
      "Security Group EC2 itu stateful firewall. Minimum: 22 dari IP kamu (/32) atau lewat SSM Session Manager tanpa membuka 22 sama sekali, 80 dan 443 dari 0.0.0.0/0. Egress default allow all. Jangan buka 3000, 5432, atau 6379 ke internet.\n\nKalau SSH timeout: cek SG, Network ACL, dan apakah instance punya public IP / NAT.",
  },
  {
    match: /(terraform|iac|state)/i,
    reply:
      "Terraform menyimpan state (terraform.tfstate) yang memetakan resource nyata ke konfigurasi. Untuk tim, simpan state di S3 + DynamoDB lock, jangan di laptop. Alur: terraform init → fmt → validate → plan -out tfplan → apply tfplan. Hapus lab dengan terraform destroy agar tidak kena biaya.\n\nModul di repo ini membuat VPC, public subnet, IGW, SG, IAM SSM, EC2, EIP, dan Route 53 opsional.",
  },
  {
    match: /(docker|container|compose|\bimage\b)/i,
    reply:
      "Di lab ini Docker mengemas aplikasi Next.js menjadi image dan menjalankannya sebagai container. Docker Compose mengatur dua service: app (Next.js standalone, port 3000) dan db (PostgreSQL 17 dengan named volume db-data). Container app berjalan sebagai user non-root, punya healthcheck ke /api/health, dan hanya diakses Nginx lewat network internal.\n\nPerintah harian: docker compose ps, docker compose logs -f app, lalu docker compose build app && docker compose up -d app setelah ada perubahan kode. Data PostgreSQL tetap aman saat container di-recreate karena tersimpan di volume, bukan di filesystem container.",
  },
  {
    match: /(kubernetes|k8s|helm|kubectl|\bpod\b|orchestrat)/i,
    reply:
      "Kubernetes menjalankan container sebagai Pod, dikelola Deployment (replica + rolling update), diekspos lewat Service, dan diakses dari luar lewat Ingress. Helm mempaket manifest menjadi chart yang bisa di-parameterisasi (values.yaml).\n\nUntuk lab ini, EC2 + Docker sudah cukup. Naik ke K8s saat butuh multi-node, autoscaling, atau self-healing antar service — bukan karena ingin terlihat keren.",
  },
  {
    match: /(github\s*actions|ci\/?cd|pipeline)/i,
    reply:
      "Alur di repo: push ke main → job build (checkout, buildx, login GHCR, build & push tag sha) → job deploy (SSH ke EC2 via key/tailscale, docker compose pull && up -d, health check, cleanup image lama). Simpan host/user/key sebagai GitHub Secrets, dan gunakan environment protection untuk production.\n\nGagal di health check = rollback otomatis; jangan biarkan pipeline hijau padahal app mati.",
  },
  {
    match: /(vpc|subnet|internet\s*gateway|nat)/i,
    reply:
      "VPC adalah jaringan privatmu. Public subnet punya route 0.0.0.0/0 ke Internet Gateway dan instance-nya bisa diberi public IP. Private subnet tidak punya route langsung ke IGW; untuk keluar butuh NAT Gateway (mahal) atau VPC Endpoint untuk S3/SSM.\n\nDi lab ini app ada di public subnet, tapi port yang terbuka hanya 80/443. Database produksi seharusnya di private subnet.",
  },
  {
    match: /(iam|role|policy|least\s*privilege)/i,
    reply:
      "Policy = dokumen izin (apa yang boleh). Role = identitas sementara yang bisa dipakai EC2/ECS untuk mendapatkan kredensial berputar. Jangan taruh access key di repo atau image. Untuk EC2, lampirkan instance profile dengan AmazonSSMManagedInstanceCore + CloudWatchAgentServerPolicy saja.\n\nPrinsip least privilege: mulai dari nol, tambah izin hanya saat ada error AccessDenied yang jelas.",
  },
  {
    match: /(biaya|cost|free\s*tier|mahal)/i,
    reply:
      "t3.micro, 20 GB gp3, dan transfer kecil biasanya masih dalam free tier 12 bulan. Yang sering menjebak: Elastic IP idle, snapshot, NAT Gateway, dan instance yang lupa dimatikan. Pasang AWS Budgets (mis. alert $1 dan $5), tag semua resource, dan jalankan terraform destroy setelah selesai.",
  },
];

const fallback =
  "Saya menjawab dari knowledge base lokal lab ini. Coba tanyakan salah satu topik: Docker/container, port & security group, Elastic IP, multi-stage Dockerfile, Nginx/HTTPS, Terraform, GitHub Actions rollback, Kubernetes/Helm, IAM, atau biaya AWS.\n\nUntuk jawaban AI generatif, set OPENAI_API_KEY di environment container.";

function localAnswer(question: string): string {
  const found = knowledge.find((entry) => entry.match.test(question));
  return found?.reply ?? fallback;
}

async function openAiAnswer(question: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content:
              "Kamu adalah mentor DevOps berbahasa Indonesia. Jawab ringkas, praktis, dan akurat tentang deploy Next.js ke AWS EC2 dengan Docker, Nginx, HTTPS, Terraform, Kubernetes/Helm, dan GitHub Actions. Sertakan perintah atau langkah verifikasi bila relevan. Jangan mengarang fitur.",
          },
          { role: "user", content: question },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const reply = data.choices?.[0]?.message?.content?.trim();
    return reply && reply.length > 0 ? reply : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: Body;

  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Body harus JSON." }, { status: 400 });
  }

  const message =
    typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json(
      { error: "Field 'message' wajib diisi." },
      { status: 400 },
    );
  }

  if (message.length > 1000) {
    return NextResponse.json(
      { error: "Pesan maksimal 1000 karakter." },
      { status: 413 },
    );
  }

  const aiReply = await openAiAnswer(message);

  return NextResponse.json(
    {
      reply: aiReply ?? localAnswer(message),
      source: aiReply ? "openai" : "local",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
