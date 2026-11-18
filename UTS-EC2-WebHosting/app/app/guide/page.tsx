import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Code2,
  Container,
  Database,
  FileCheck2,
  GitBranch,
  Globe2,
  Layers3,
  LockKeyhole,
  Network,
  Plus,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
} from "lucide-react";
import ChatWidget from "@/components/chat-widget";
import DeploymentConfigurator from "@/components/deployment-configurator";
import Guestbook from "@/components/guestbook";
import GuideChecklist from "@/components/guide-checklist";
import ReferenceLibrary from "@/components/reference-library";
import SectionNav from "@/components/section-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { checklist, steps, stack } from "@/lib/content";
import { referenceGroups, totalReferences } from "@/lib/references";

export const metadata = {
  title: "Panduan UTS Cloud Computing",
  description:
    "Panduan lengkap deployment Next.js ke AWS EC2: Docker, Nginx, HTTPS, PostgreSQL, Terraform, dan pipeline rilis.",
};

const stepIcons = [
  Server,
  ShieldCheck,
  Terminal,
  Container,
  Network,
  Globe2,
  Code2,
  GitBranch,
  Layers3,
] as const;

const flow = [
  {
    label: "Internet",
    detail: "https://app.domain.com",
    icon: Globe2,
    tone: "border-border bg-card text-foreground",
  },
  {
    label: "Route 53",
    detail: "A record → Elastic IP",
    icon: Cloud,
    tone: "border-sky-200 bg-sky-50 text-sky-900",
  },
  {
    label: "Nginx · EC2",
    detail: "443 HTTPS · 80 redirect",
    icon: Network,
    tone: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    label: "Next.js",
    detail: "standalone · non-root",
    icon: Code2,
    tone: "border-violet-200 bg-violet-50 text-violet-900",
  },
  {
    label: "PostgreSQL",
    detail: "volume db-data · 5432",
    icon: Database,
    tone: "border-cyan-200 bg-cyan-50 text-cyan-900",
  },
] as const;

const portRows = [
  {
    service: "HTTPS",
    port: "443",
    source: "0.0.0.0/0",
    exposure: "Publik",
    tone: "success" as const,
  },
  {
    service: "HTTP",
    port: "80",
    source: "0.0.0.0/0",
    exposure: "Redirect ke HTTPS",
    tone: "info" as const,
  },
  {
    service: "SSH",
    port: "22",
    source: "IP admin /32",
    exposure: "Terbatas",
    tone: "warning" as const,
  },
  {
    service: "Next.js",
    port: "3000",
    source: "Jaringan Docker",
    exposure: "Privat",
    tone: "outline" as const,
  },
  {
    service: "PostgreSQL",
    port: "5432",
    source: "Jaringan Docker",
    exposure: "Privat",
    tone: "outline" as const,
  },
];

const faqs = [
  {
    question: "Apakah halaman ini membuat resource AWS?",
    answer:
      "Tidak. Seluruh configurator hanya menyimpan pilihan di browser atau PostgreSQL aplikasi. Tidak ada panggilan AWS API, terraform plan, terraform apply, atau provisioning resource dari halaman ini.",
  },
  {
    question: "Kenapa port 3000 dan 5432 tidak boleh dibuka ke internet?",
    answer:
      "Port 3000 adalah port internal aplikasi dan 5432 adalah port database. Membukanya akan melewati lapisan Nginx/TLS dan memperbesar permukaan serangan. Akses publik cukup melalui 443; Nginx dan jaringan Docker menangani jalur internal.",
  },
  {
    question: "Kapan sebaiknya memilih RDS dibanding PostgreSQL di Docker?",
    answer:
      "Untuk lab satu EC2, PostgreSQL dalam Docker lebih murah dan mudah dipahami. RDS masuk akal ketika butuh backup terkelola, multi-AZ, patching otomatis, dan pemisahan beban database—dengan catatan biaya serta konfigurasi subnet privat dan security group.",
  },
  {
    question: "Apakah data saya disimpan di cloud?",
    answer:
      "Data akun, konfigurasi, dan buku tamu disimpan di database PostgreSQL yang terhubung ke aplikasi. Progres checklist panduan tersimpan lokal di browser. Tidak ada data yang dikirim ke AWS oleh halaman ini.",
  },
  {
    question: "Apa yang harus dilakukan jika health check gagal?",
    answer:
      "Periksa status container (docker compose ps), log aplikasi (docker compose logs app), koneksi database, dan respons /api/health. Jangan melakukan deployment baru sebelum penyebabnya jelas dan lingkungan pulih.",
  },
  {
    question: "Bagaimana urutan rollback yang aman?",
    answer:
      "Hentikan rilis, kembalikan image/app ke versi stabil, jalankan health check, lalu komunikasikan status. Pastikan database migration memiliki strategi kompatibel mundur dan backup sebelum rollback dijalankan.",
  },
];

export default function GuidePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
          <div className="pointer-events-none absolute -right-48 -top-56 size-[560px] rounded-full bg-brand/15 blur-3xl" />

          <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16 lg:px-8 lg:py-20">
            <div className="animate-rise">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand" className="px-3 py-1 text-xs">
                  <BookOpen className="size-3" />
                  Panduan lab
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-xs">
                  UTS · Single EC2
                </Badge>
              </div>

              <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
                Panduan UTS Cloud Computing,{" "}
                <span className="text-muted-foreground">dari nol sampai rilis.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-pretty text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
                Pelajari alur lengkap menyiapkan server, menjalankan container,
                mengamankan trafik HTTPS, menyimpan data, dan menyusun pipeline
                rilis. Setiap tahap dilengkapi konteks, contoh, dan kriteria
                verifikasi.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#roadmap"
                  className={cn(buttonVariants({ size: "lg" }), "group")}
                >
                  Mulai dari langkah 01
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="#checklist"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  <FileCheck2 />
                  Buka checklist
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  9 tahap terstruktur
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="size-3.5" />
                  {totalReferences} sumber referensi
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" />
                  Tanpa provisioning otomatis
                </span>
              </div>
            </div>

            <Card className="animate-rise gap-0 overflow-hidden p-0 shadow-xl shadow-foreground/[0.05] [animation-delay:120ms]">
              <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-rose-400" />
                  <span className="size-2.5 rounded-full bg-amber-400" />
                  <span className="size-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                    ec2-lab · quickstart
                  </span>
                </div>
                <Badge variant="outline" className="bg-background text-[9px]">
                  Pratinjau
                </Badge>
              </div>
              <div className="space-y-2.5 p-5 font-mono text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                <p>
                  <span className="text-foreground">$</span> git clone &lt;repository&gt;
                </p>
                <p>
                  <span className="text-foreground">$</span> cd uts-cloud-computing
                </p>
                <p className="pt-1 text-muted-foreground/70">
                  # jalankan stack untuk pengujian
                </p>
                <p>
                  <span className="text-foreground">$</span> docker compose up -d
                </p>
                <p className="pt-1 text-muted-foreground/70">
                  # verifikasi aplikasi + database
                </p>
                <p>
                  <span className="text-foreground">$</span> curl localhost:3000/api/health
                </p>
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 font-mono text-emerald-800">
                  {'{ "status": "ok", "db": { "status": "up" } }'}
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-[10px]">
                  <span>Docker · Nginx · HTTPS</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-700">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    sehat
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <SectionNav />

        {/* Roadmap */}
        <section
          id="roadmap"
          className="mx-auto w-full max-w-7xl scroll-mt-32 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                01 · Rencana langkah
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Sembilan langkah menuju server yang siap.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                Kerjakan berurutan. Jangan lanjut ke Kubernetes sebelum Docker,
                database, Nginx, HTTPS, dan health check stabil.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{steps.length} tahap</Badge>
              <Badge variant="secondary">1 instance</Badge>
              <Badge variant="secondary">0 resource otomatis</Badge>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = stepIcons[index] ?? Sparkles;
              return (
                <article
                  key={step.id}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-ring/50 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[10px] font-semibold text-muted-foreground">
                      {step.id} / 09
                    </span>
                  </div>
                  <Badge variant="outline" className="mt-4 w-fit text-[10px]">
                    {step.tag}
                  </Badge>
                  <h3 className="mt-3 text-base font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.desc}
                  </p>
                  <ChevronRight className="mt-4 size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                </article>
              );
            })}
          </div>
        </section>

        {/* Architecture */}
        <section
          id="arsitektur"
          className="scroll-mt-32 border-y border-border bg-muted/30"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                02 · Arsitektur
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Satu jalur publik. Layanan data tetap privat.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                Browser mengakses Nginx melalui HTTPS. Nginx meneruskan
                permintaan ke aplikasi; aplikasi mengakses database lewat
                jaringan Docker privat. Port aplikasi dan database tidak dibuka
                ke internet.
              </p>

              <ul className="mt-8 space-y-3">
                {[
                  [
                    "DNS Route 53",
                    "Catatan A mengarah ke Elastic IP agar alamat server tetap.",
                  ],
                  [
                    "Nginx",
                    "Mengelola TLS, redirect HTTP, header keamanan, dan proxy ke aplikasi.",
                  ],
                  [
                    "Jaringan Docker",
                    "Memisahkan jalur proxy, aplikasi, dan database.",
                  ],
                  [
                    "PostgreSQL",
                    "Data tersimpan di volume db-data; port database tetap internal.",
                  ],
                  [
                    "Health check",
                    "/api/health memeriksa aplikasi sekaligus koneksi database.",
                  ],
                ].map(([title, description]) => (
                  <li
                    key={title}
                    className="flex gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <p className="text-sm leading-6 text-muted-foreground">
                      <span className="font-semibold text-foreground">{title}</span>{" "}
                      — {description}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Alert variant="success" className="py-3">
                  <LockKeyhole />
                  <div>
                    <AlertTitle className="text-xs">Akses publik terbatas</AlertTitle>
                    <AlertDescription className="text-xs">
                      22 hanya IP admin · 80 · 443
                    </AlertDescription>
                  </div>
                </Alert>
                <Alert variant="destructive" className="py-3">
                  <AlertTriangle />
                  <div>
                    <AlertTitle className="text-xs">Jangan dibuka ke internet</AlertTitle>
                    <AlertDescription className="text-xs">
                      3000 app · 5432 database · 6379 · 8090
                    </AlertDescription>
                  </div>
                </Alert>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="gap-0 p-0">
                <CardHeader className="border-b border-border py-4">
                  <CardTitle className="text-sm">Jalur permintaan</CardTitle>
                  <CardDescription className="text-xs">
                    Dari browser sampai data, tanpa lompatan yang tidak terlihat.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  <div className="space-y-2">
                    {flow.map((layer, index) => {
                      const Icon = layer.icon;
                      return (
                        <div key={layer.label}>
                          <div
                            className={cn(
                              "flex items-center gap-3 rounded-lg border px-4 py-3.5",
                              layer.tone,
                            )}
                          >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-black/5 bg-white/60">
                              <Icon className="size-4" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold">{layer.label}</p>
                              <p className="mt-0.5 truncate font-mono text-[10px] opacity-70">
                                {layer.detail}
                              </p>
                            </div>
                            {index === flow.length - 1 ? (
                              <LockKeyhole className="size-3.5 opacity-50" aria-hidden="true" />
                            ) : (
                              <ArrowRight className="size-3.5 opacity-40" aria-hidden="true" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-0 overflow-hidden p-0">
                <CardHeader className="border-b border-border py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">Matriks port</CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        Aturan akses yang perlu diperiksa di security group.
                      </CardDescription>
                    </div>
                    <Badge variant="success">Default aman</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-5">Layanan</TableHead>
                        <TableHead>Port</TableHead>
                        <TableHead className="hidden sm:table-cell">Sumber</TableHead>
                        <TableHead className="pr-5 text-right">Akses</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portRows.map((row) => (
                        <TableRow key={row.service}>
                          <TableCell className="pl-5 font-medium">{row.service}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {row.port}
                          </TableCell>
                          <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                            {row.source}
                          </TableCell>
                          <TableCell className="pr-5 text-right">
                            <Badge variant={row.tone === "outline" ? "outline" : row.tone}>
                              {row.exposure}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Checklist */}
        <section
          id="checklist"
          className="mx-auto w-full max-w-7xl scroll-mt-32 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                03 · Validasi
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Pastikan tiap tahap siap sebelum lanjut.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                Gunakan daftar ini untuk memastikan setiap bagian benar-benar
                berfungsi. Perbaiki kegagalan di lingkungan latihan sebelum
                menerapkannya ke server produksi.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="#konfigurasi" className={buttonVariants({ size: "sm" })}>
                  Atur konfigurasi
                  <ArrowRight />
                </Link>
                <Link
                  href="#arsitektur"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Tinjau arsitektur
                </Link>
              </div>

              <Alert variant="warning" className="mt-7">
                <AlertTriangle />
                <div>
                  <AlertTitle>Perhatikan biaya AWS</AlertTitle>
                  <AlertDescription>
                    Harga dan program gratis bergantung pada akun, region, dan
                    ketentuan AWS yang berlaku. Pasang AWS Budgets agar mendapat
                    peringatan biaya. Sebelum menghapus resource, tinjau dampaknya,
                    snapshot, dan data yang perlu dipertahankan.
                  </AlertDescription>
                </div>
              </Alert>

              <div className="mt-5 rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Tips verifikasi
                </p>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
                  <li className="flex gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    Cek respons /api/health sebelum menganggap rilis sukses.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    Uji akses dari perangkat di luar server, bukan hanya localhost.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    Catat langkah rollback sebelum mengubah konfigurasi produksi.
                  </li>
                </ul>
              </div>
            </div>

            <GuideChecklist />
          </div>
        </section>

        <DeploymentConfigurator />

        {/* Guestbook */}
        <section
          id="guestbook"
          className="scroll-mt-32 border-y border-border bg-card"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:px-8">
            <div className="self-center">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                04 · Database
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Data tersimpan, bukan sekadar demo tampilan.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                Secara default PostgreSQL berjalan sebagai container di EC2.
                File database disimpan pada volume Docker{" "}
                <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground">
                  db-data
                </code>
                , sehingga tetap ada ketika container aplikasi dibuat ulang.
              </p>

              <ul className="mt-6 space-y-3 text-sm">
                {[
                  [
                    "PostgreSQL 17",
                    "Container terpisah, dipantau dengan pg_isready dan health check aplikasi.",
                  ],
                  [
                    "AWS RDS (opsional)",
                    "Database terkelola; simpan di subnet privat dan batasi aksesnya.",
                  ],
                  [
                    "Buku tamu",
                    "Contoh tulis dan baca pesan melalui API /api/guestbook.",
                  ],
                  [
                    "Pencadangan",
                    "Salinan database dapat dibuat dengan pg_dump; uji pemulihan berkala.",
                  ],
                  [
                    "Adminer",
                    "Gunakan melalui SSH tunnel, jangan pernah membuka akses publik.",
                  ],
                ].map(([title, description]) => (
                  <li key={title} className="flex gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sky-50 text-[10px] font-bold text-sky-700 ring-1 ring-sky-200">
                      i
                    </span>
                    <p className="text-sm leading-6 text-muted-foreground">
                      <span className="font-semibold text-foreground">{title}</span>{" "}
                      — {description}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-[11px] text-muted-foreground">
                <Database className="size-3.5" />
                Jalur data: Nginx → Next.js → PostgreSQL · port 5432 privat
              </div>
            </div>

            <Guestbook />
          </div>
        </section>

        {/* AI Assistant */}
        <section id="asisten" className="scroll-mt-32 bg-muted/30">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:px-8">
            <div className="self-center">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                05 · Bantuan
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Butuh konteks? Tanya asisten lab.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                Endpoint{" "}
                <code className="rounded-md bg-card px-1.5 py-0.5 font-mono text-[12px] text-foreground ring-1 ring-border">
                  /api/ai
                </code>{" "}
                memakai OpenAI jika{" "}
                <code className="rounded-md bg-card px-1.5 py-0.5 font-mono text-[12px] text-foreground ring-1 ring-border">
                  OPENAI_API_KEY
                </code>{" "}
                tersedia. Tanpa kunci, asisten menjawab dari panduan lokal.
              </p>

              <div className="mt-6 space-y-2.5 rounded-xl border border-border bg-card p-4 font-mono text-xs text-muted-foreground shadow-sm">
                <p className="flex items-center gap-2">
                  <Badge variant="info" className="font-mono text-[9px]">
                    POST
                  </Badge>
                  /api/ai{" "}
                  <span className="text-muted-foreground/60">{"{ message }"}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Badge variant="success" className="font-mono text-[9px]">
                    GET
                  </Badge>
                  /api/health{" "}
                  <span className="text-muted-foreground/60">app + database</span>
                </p>
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-lg border border-border bg-card/60 p-3 text-[11px] leading-5 text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                Kunci API tidak pernah ditampilkan ke pengguna. Jawaban AI bersifat
                bantuan belajar, bukan pengganti dokumentasi resmi.
              </div>
            </div>

            <ChatWidget />
          </div>
        </section>

        {/* References */}
        <section
          id="referensi"
          className="mx-auto w-full max-w-7xl scroll-mt-32 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="flex flex-col justify-between gap-5 border-b border-border pb-8 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                06 · Pustaka bacaan
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Pahami referensinya. Pilih dengan alasan yang jelas.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Ringkasan menjelaskan topik, kapan sumber berguna, dan cara
                menghubungkannya ke lab. Gunakan sebagai peta belajar, lalu
                verifikasi detail teknis, versi, dan prasyarat di halaman asli.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Badge variant="outline" className="bg-card px-3 py-1.5">
                <Layers3 className="size-3" />3 kelompok topik
              </Badge>
              <Badge variant="outline" className="bg-card px-3 py-1.5">
                <BookOpen className="size-3" />
                {totalReferences} sumber asli
              </Badge>
            </div>
          </div>

          <div className="mt-8">
            <ReferenceLibrary groups={referenceGroups} />
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["EC2", "Mesin virtual di AWS untuk menjalankan server aplikasi."],
              [
                "Docker",
                "Teknologi untuk mengemas aplikasi dan dependensinya ke dalam container.",
              ],
              [
                "CI/CD",
                "Otomatisasi pemeriksaan, pembuatan, dan pengiriman perubahan aplikasi.",
              ],
              [
                "Provider Terraform",
                "Plugin yang menghubungkan Terraform/OpenTofu dengan layanan AWS.",
              ],
            ].map(([term, definition]) => (
              <div
                key={term}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <p className="text-xs font-semibold text-foreground">{term}</p>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {definition}
                </p>
              </div>
            ))}
          </div>

          <Alert variant="warning" className="mt-8">
            <AlertTriangle />
            <div>
              <AlertTitle>Sebelum menyalin langkah atau konfigurasi</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 grid gap-2 text-xs leading-5 md:grid-cols-2">
                  <li>
                    <span className="font-semibold">01.</span> Ringkasan membantu
                    memilih bacaan; verifikasi detail dan contoh teknis pada
                    halaman sumber.
                  </li>
                  <li>
                    <span className="font-semibold">02.</span> Perintah, versi, dan
                    harga dapat berubah. Cocokkan dengan dokumentasi AWS dan
                    kebutuhan akun.
                  </li>
                  <li>
                    <span className="font-semibold">03.</span> Jangan masukkan
                    kredensial, private key, atau password ke repository maupun
                    konfigurasi publik.
                  </li>
                  <li>
                    <span className="font-semibold">04.</span> Lab ini hanya
                    menyimpan konfigurasi dan menyiapkan file lokal; tidak
                    menjalankan apply atau membuat resource AWS.
                  </li>
                </ul>
              </AlertDescription>
            </div>
          </Alert>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-32 border-t border-border bg-muted/30">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16 lg:px-8">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                07 · FAQ
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Pertanyaan yang sering muncul.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Belum menemukan jawaban? Tanyakan langsung ke asisten lab atau
                buka dokumentasi sumber di bagian referensi.
              </p>
              <Link
                href="#asisten"
                className={cn(buttonVariants({ variant: "outline" }), "mt-6")}
              >
                <Sparkles />
                Tanya asisten
              </Link>
            </div>

            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {faqs.map((faq) => (
                <details key={faq.question} className="group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/40 sm:px-6 [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <Plus className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45" />
                  </summary>
                  <div className="px-5 pb-5 sm:px-6">
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-950 px-6 py-12 text-zinc-100 shadow-2xl shadow-zinc-950/10 sm:px-12 sm:py-14">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
            <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-brand/25 blur-3xl" />
            <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-2xl">
                <Badge
                  variant="outline"
                  className="border-white/10 bg-white/[0.06] text-zinc-300"
                >
                  <Users className="size-3" />
                  Workspace pribadi
                </Badge>
                <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Simpan progres. Rancang deployment. Tinjau sebelum apply.
                </h2>
                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  Masuk untuk membuka checklist EC2, workspace database, dan
                  configurator pipeline yang tersimpan di PostgreSQL.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Link
                  href="/login?next=%2Fdashboard%23pipeline"
                  className={cn(buttonVariants({ variant: "brand", size: "lg" }))}
                >
                  Masuk ke workspace
                  <ArrowRight />
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                      size: "lg",
                      className:
                        "border-white/15 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white",
                    }),
                  )}
                >
                  Buat akun
                  <ArrowUpRight />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
