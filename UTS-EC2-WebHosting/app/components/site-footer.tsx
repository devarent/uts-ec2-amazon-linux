import Link from "next/link";
import { ArrowUpRight, Code2, Server } from "lucide-react";
import { Brand } from "@/components/brand";
import { Separator } from "@/components/ui/separator";

const columns = [
  {
    title: "Panduan",
    links: [
      { label: "Rencana langkah", href: "/guide#roadmap" },
      { label: "Arsitektur", href: "/guide#arsitektur" },
      { label: "Checklist", href: "/guide#checklist" },
      { label: "Konfigurasi", href: "/guide#konfigurasi" },
    ],
  },
  {
    title: "Sumber belajar",
    links: [
      { label: "Referensi deployment", href: "/guide#referensi" },
      { label: "Buku tamu", href: "/guide#guestbook" },
      { label: "Asisten lab", href: "/guide#asisten" },
      { label: "FAQ", href: "/guide#faq" },
    ],
  },
  {
    title: "Workspace",
    links: [
      { label: "Masuk", href: "/login" },
      { label: "Buat akun", href: "/register" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Health check", href: "/api/health" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Brand />
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Lab praktik deployment Next.js ke AWS EC2. Belajar satu jalur
              request—dari browser, Nginx, aplikasi, hingga PostgreSQL—tanpa
              membuat resource AWS otomatis.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Local-first
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1">
                <Server className="size-3" />
                Single EC2
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                  {column.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            UTS Cloud Computing — AWS EC2 · dibuat untuk belajar deploy, bukan sekadar
            “jalan di localhost”.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-mono">
              Next.js · Tailwind · PostgreSQL · Docker
            </span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <Code2 className="size-3.5" />
              GitHub
              <ArrowUpRight className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
