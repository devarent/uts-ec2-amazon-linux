import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Cloud,
  Database,
  GitBranch,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { Brand } from "@/components/brand";

const points = [
  {
    icon: Terminal,
    title: "Sembilan tahap terstruktur",
    description: "Dari EC2 dan Docker hingga HTTPS dan pipeline rilis.",
  },
  {
    icon: Database,
    title: "Konfigurasi tersimpan",
    description: "Checklist dan pengaturan tersimpan per akun di PostgreSQL.",
  },
  {
    icon: ShieldCheck,
    title: "Aman untuk belajar",
    description: "Tidak ada provisioning atau perubahan resource AWS otomatis.",
  },
];

export function AuthShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-zinc-950 p-10 text-zinc-100 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="pointer-events-none absolute -right-40 -top-40 size-[480px] rounded-full bg-brand/20 blur-3xl" />

        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <span className="relative flex size-9 items-center justify-center rounded-[10px] bg-white text-zinc-950">
              <Cloud className="size-4.5" strokeWidth={1.8} aria-hidden="true" />
              <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-zinc-950 bg-brand" />
            </span>
            <span className="flex flex-col">
              <span className="text-[13px] font-semibold leading-tight text-white">
                UTS Cloud Computing
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">
                UTS · Cloud Computing
              </span>
            </span>
          </Link>
        </div>

        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-zinc-300">
            <GitBranch className="size-3" aria-hidden="true" />
            Deploy with confidence
          </span>
          <h2 className="mt-5 text-balance text-3xl font-semibold leading-[1.12] tracking-tight text-white xl:text-4xl">
            Dari <span className="font-mono text-brand">localhost</span> ke AWS,
            tanpa langkah yang misterius.
          </h2>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            Satu workspace untuk merancang deployment, memverifikasi setiap
            tahap, dan menyiapkan konfigurasi yang bisa ditinjau sebelum
            menyentuh infrastructure.
          </p>

          <ul className="mt-8 space-y-4">
            {points.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-100">{title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] font-medium text-zinc-400">
              Progress preview
            </p>
            <span className="font-mono text-[10px] text-zinc-500">6 / 9</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/3 rounded-full bg-brand" />
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-500">
            <Check className="size-3 text-emerald-400" aria-hidden="true" />
            EC2 · Docker · Nginx · HTTPS siap diverifikasi
          </div>
        </div>
      </aside>

      <main className="relative flex min-h-screen flex-col bg-muted/30">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Brand className="lg:hidden" />
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Kembali ke beranda
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-8">
          <div className="w-full max-w-md">
            {children}
            {footer ? (
              <p className="mt-5 px-2 text-center text-xs leading-5 text-muted-foreground">
                {footer}
              </p>
            ) : null}
          </div>
        </div>

        <p className="px-8 pb-6 text-center text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} UTS Cloud Computing — AWS EC2 · Next.js · Tailwind ·
          PostgreSQL
        </p>
      </main>
    </div>
  );
}
