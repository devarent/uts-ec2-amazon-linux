"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, LayoutDashboard, Menu, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Panduan", href: "/guide#roadmap" },
  { label: "Arsitektur", href: "/guide#arsitektur" },
  { label: "Checklist", href: "/guide#checklist" },
  { label: "Referensi", href: "/guide#referensi" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Brand />

        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-1 md:flex"
        >
          {navigation.map((item) => {
            const active = pathname === "/guide" && item.href.includes("#");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  active && "text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-9 px-3")}
          >
            <LayoutDashboard className="size-3.5" />
            Masuk
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "sm" }), "h-9 px-3.5")}
          >
            Buat akun
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-background text-foreground shadow-sm transition hover:bg-accent md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-navigation"
          className="animate-fade border-t border-border bg-background md:hidden"
        >
          <nav
            aria-label="Navigasi seluler"
            className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6"
          >
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Jelajahi lab
            </p>
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent"
              >
                <BookOpen className="size-4 text-muted-foreground" />
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-4">
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                Masuk
              </Link>
              <Link href="/register" className={cn(buttonVariants(), "w-full")}>
                Buat akun
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
