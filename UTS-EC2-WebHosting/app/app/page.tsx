import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Code2,
  Database,
  FileCheck2,
  GitBranch,
  Globe2,
  Layers3,
  LockKeyhole,
  Network,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
} from "lucide-react";
import AuthForm from "@/components/auth-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { steps, stack } from "@/lib/content";
import { getCurrentUser } from "@/lib/auth";

type HomeProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

const stats = [
  { value: "9", label: "tahap terstruktur" },
  { value: "12", label: "sumber referensi" },
  { value: "0", label: "resource AWS dibuat" },
];

const features = [
  {
    icon: Terminal,
    title: "Konfigurasi tanpa provisioning",
    description:
      "Susun pilihan EC2, database, dan pipeline. Semua disimpan sebagai konfigurasi—bukan resource AWS.",
    href: "/guide#konfigurasi",
    linkLabel: "Buka configurator",
  },
  {
    icon: Database,
    title: "Data benar-benar persisten",
    description:
      "PostgreSQL 17 berjalan pada volume Docker dengan health check dan jalur akses privat.",
    href: "/guide#guestbook",
    linkLabel: "Lihat demo database",
  },
  {
    icon: GitBranch,
    title: "Rilis yang bisa ditinjau",
    description:
      "Rancang Source, Build, dan Deploy dengan pola CodePipeline yang jelas dan aman.",
    href: "/guide#konfigurasi",
    linkLabel: "Rancang pipeline",
  },
];

const flow = [
  { label: "Browser", icon: Globe2, detail: "HTTPS · 443" },
  { label: "Nginx", icon: Network, detail: "TLS · proxy" },
  { label: "Next.js", icon: Code2, detail: "app · 3000" },
  { label: "PostgreSQL", icon: Database, detail: "privat · 5432" },
];

function StepPreview() {
  return (
    <div className="grid overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((step, index) => (
        <article
          key={step.id}
          className={cn(
            "group relative p-5 transition-colors hover:bg-muted/50",
            index !== steps.length - 1 && "border-b border-border sm:border-r",
            index % 2 === 0 && "sm:border-r",
            index % 3 === 2 && "lg:border-r-0",
            index >= 6 && "sm:border-b-0",
            index === 7 && "sm:border-b-0",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] font-semibold text-muted-foreground">
              {step.id}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {step.tag}
            </Badge>
          </div>
          <h3 className="mt-4 text-sm font-semibold tracking-tight text-foreground">
            {step.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {step.desc}
          </p>
          <ChevronRight className="absolute bottom-5 right-4 size-4 text-muted-foreground/0 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
        </article>
      ))}
    </div>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  if (await getCurrentUser()) redirect("/dashboard");
  const params = await searchParams;
  const requestedPath = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath =
    requestedPath === "/dashboard" || !requestedPath
      ? "/dashboard#pipeline"
      : requestedPath;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
          <div className="pointer-events-none absolute -right-40 -top-56 size-[560px] rounded-full bg-brand/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-40 top-40 size-[380px] rounded-full bg-sky-200/30 blur-3xl" />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.72fr)] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-24">
            <div className="animate-rise">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand" className="gap-2 px-3 py-1 text-xs">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  Lab deployment AWS · UTS
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-xs">
                  Next.js 16 · Tailwind 4 · PostgreSQL
                </Badge>
              </div>

              <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Deploy Next.js ke AWS dengan{" "}
                <span className="relative whitespace-nowrap">
                  <span className="relative z-10">alur yang jelas.</span>
                  <span className="absolute inset-x-0 bottom-1 z-0 h-3 rounded-sm bg-brand/30" />
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Pelajari perjalanan aplikasi dari{" "}
                <span className="font-mono text-sm text-foreground">localhost</span>{" "}
                sampai server EC2: Docker, Nginx, HTTPS, database, dan pipeline
                rilis. Setiap tahap punya kriteria selesai yang bisa diperiksa.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/guide#roadmap"
                  className={cn(buttonVariants({ size: "lg" }), "group")}
                >
                  Mulai dari langkah pertama
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/guide#checklist"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  <FileCheck2 />
                  Lihat checklist
                </Link>
              </div>

              <dl className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card/70 p-1 shadow-sm backdrop-blur">
                {stats.map((stat) => (
                  <div key={stat.label} className="px-4 py-3.5 text-center sm:text-left">
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <span className="text-2xl font-semibold tracking-tight text-foreground">
                        {stat.value}
                      </span>
                      <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        {stat.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  Data tersimpan di PostgreSQL
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <LockKeyhole className="size-3.5 text-muted-foreground" />
                  Tanpa provisioning otomatis
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Globe2 className="size-3.5 text-muted-foreground" />
                  Bahasa Indonesia
                </span>
              </div>
            </div>

            <div className="animate-rise mx-auto w-full max-w-md [animation-delay:120ms] lg:ml-auto">
              <AuthForm mode="login" nextPath={nextPath} />
              <p className="mt-4 flex items-center justify-center gap-1.5 px-4 text-center text-xs leading-5 text-muted-foreground">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Akun dan progres checklist tersimpan per pengguna.
              </p>
            </div>
          </div>
        </section>

        {/* Stack strip */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Teknologi yang dibahas
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {stack.slice(0, 9).map((item) => (
                <span
                  key={item}
                  className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Feature bento */}
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                01 · Workspace
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Satu workspace untuk seluruh alur deploy.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                Rancang, verifikasi, dan tinjau sebelum menyentuh server. Semua
                bagian saling terhubung dan tersimpan.
              </p>
            </div>
            <Link
              href="/guide"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition hover:gap-2.5"
            >
              Jelajahi panduan
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-12">
            <Card className="relative gap-0 overflow-hidden p-0 lg:col-span-7">
              <div className="flex items-start justify-between gap-4 p-6 pb-5">
                <div>
                  <Badge variant="secondary" className="mb-3">
                    Arsitektur
                  </Badge>
                  <h3 className="text-lg font-semibold tracking-tight">
                    Satu jalur publik. Layanan data tetap privat.
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Browser masuk melalui HTTPS, Nginx meneruskan ke aplikasi,
                    lalu aplikasi mengakses database lewat jaringan internal.
                  </p>
                </div>
                <span className="hidden size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground sm:flex">
                  <Network className="size-5" />
                </span>
              </div>

              <div className="relative mx-6 mb-6 overflow-hidden rounded-xl border border-border bg-muted/30 p-5">
                <div className="pointer-events-none absolute inset-0 bg-dots opacity-40" />
                <div className="relative flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  {flow.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex flex-1 items-center gap-2">
                        <div className="flex flex-1 flex-col items-center rounded-lg border border-border bg-card px-3 py-4 text-center shadow-sm">
                          <Icon className="size-4 text-muted-foreground" />
                          <span className="mt-2 text-xs font-semibold text-foreground">
                            {item.label}
                          </span>
                          <span className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                            {item.detail}
                          </span>
                        </div>
                        {index < flow.length - 1 ? (
                          <ArrowRight className="hidden size-3.5 shrink-0 text-muted-foreground/50 sm:block" />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-6 py-4 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  Port 3000 &amp; 5432 tidak dipublikasikan
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Cloud className="size-3.5" />
                  Elastic IP stabil
                </span>
              </div>
            </Card>

            <Card className="gap-0 overflow-hidden p-0 lg:col-span-5">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    Progres
                  </Badge>
                  <h3 className="text-lg font-semibold tracking-tight">
                    Checklist yang terasa nyata.
                  </h3>
                </div>
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  02 / 09
                </span>
              </div>
              <div className="p-6">
                <Progress value={22} indicatorClassName="bg-brand" />
                <p className="mt-2 text-xs text-muted-foreground">
                  2 dari 9 tahap terverifikasi
                </p>
                <div className="mt-5 space-y-3">
                  {[
                    ["Instance EC2 berjalan", true],
                    ["Firewall dibatasi dengan benar", true],
                    ["Docker & Compose aktif", false],
                  ].map(([label, done]) => (
                    <div key={String(label)} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border",
                          done
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-border bg-background text-transparent",
                        )}
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          done ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {String(label)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator className="my-5" />
                <Link
                  href="/guide#checklist"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline"
                >
                  Lihat semua kriteria
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </Card>

            {features.map(({ icon: Icon, title, description, href, linkLabel }) => (
              <Card
                key={title}
                className="group gap-0 p-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md lg:col-span-4"
              >
                <div className="p-6">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-4.5" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                  <Link
                    href={href}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground transition hover:gap-2.5"
                  >
                    {linkLabel}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  02 · Roadmap
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Sembilan langkah, satu server.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                  Ikuti urutannya. Pastikan aplikasi, database, dan health check
                  stabil sebelum melangkah ke Kubernetes.
                </p>
              </div>
              <Link
                href="/guide#roadmap"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Buka panduan lengkap
                <ArrowRight />
              </Link>
            </div>

            <div className="mt-8">
              <StepPreview />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-950 px-6 py-12 text-zinc-100 shadow-2xl shadow-zinc-950/10 sm:px-12 sm:py-16">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
            <div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-brand/25 blur-3xl" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1.3fr_0.7fr]">
              <div>
                <Badge className="border-white/10 bg-white/[0.06] text-zinc-300" variant="outline">
                  <Rocket className="size-3" />
                  Mulai dari mana saja
                </Badge>
                <h2 className="mt-5 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Siap membangun deployment pertama yang bisa dipercaya?
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400">
                  Buat akun untuk menyimpan progress, atau mulai membaca panduan
                  tanpa login. Tidak ada resource AWS yang dibuat tanpa
                  persetujuanmu.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ variant: "brand", size: "lg" }),
                    "w-full",
                  )}
                >
                  Buat akun gratis
                  <ArrowRight />
                </Link>
                <Link
                  href="/guide"
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                      size: "lg",
                      className:
                        "border-white/15 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white",
                    }),
                    "w-full",
                  )}
                >
                  <Layers3 />
                  Jelajahi panduan
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
