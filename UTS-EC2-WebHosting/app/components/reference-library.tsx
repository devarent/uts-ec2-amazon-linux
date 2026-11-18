"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ExternalLink,
  Layers3,
  Search,
  X,
} from "lucide-react";
import type { ReferenceGroup } from "@/lib/references";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Filter = "all" | string;

export default function ReferenceLibrary({
  groups,
}: {
  groups: ReferenceGroup[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return groups
      .filter((group) => filter === "all" || group.id === filter)
      .map((group) => ({
        group,
        links: group.links.filter((link) => {
          if (!needle) return true;
          return `${link.title} ${link.source} ${link.type} ${link.summary} ${link.for} ${link.labUse}`
            .toLowerCase()
            .includes(needle);
        }),
      }))
      .filter((entry) => entry.links.length > 0);
  }, [deferredQuery, filter, groups]);

  const total = results.reduce((sum, entry) => sum + entry.links.length, 0);

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari topik, sumber, atau teknologi…"
              aria-label="Cari referensi"
              className="pl-9 pr-9"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Hapus pencarian"
                className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground" role="status">
            Menampilkan{" "}
            <span className="font-semibold text-foreground">{total}</span> dari{" "}
            {groups.reduce((sum, group) => sum + group.links.length, 0)} sumber
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Layers3 className="size-3" aria-hidden="true" />
            Semua topik
          </button>
          {groups.map((group) => (
            <button
              key={group.id}
              id={group.id}
              type="button"
              onClick={() => setFilter(group.id)}
              aria-pressed={filter === group.id}
              className={cn(
                "inline-flex scroll-mt-32 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                filter === group.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {group.shortTitle}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[9px] font-semibold",
                  filter === group.id
                    ? "bg-white/15 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {group.links.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-10">
        {results.map(({ group, links }) => (
          <section key={group.id} aria-labelledby={`${group.id}-heading`}>
            <div className="flex flex-col justify-between gap-3 border-l-2 border-brand pl-4 sm:flex-row sm:items-start">
              <div className="max-w-3xl">
                <h3
                  id={`${group.id}-heading`}
                  className="text-base font-semibold text-foreground"
                >
                  {group.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {group.description}
                </p>
              </div>
              <Badge variant="secondary" className="w-fit shrink-0">
                {links.length} sumber
              </Badge>
            </div>

            <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {links.map((link, index) => {
                let hostname = link.url;
                try {
                  hostname = new URL(link.url).hostname.replace(/^www\./, "");
                } catch {
                  // Keep the raw URL when it cannot be parsed.
                }
                return (
                  <li key={link.url}>
                    <article className="group flex h-full flex-col rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-md">
                      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
                        <Badge variant="outline" className="bg-background text-[10px]">
                          {link.source}
                        </Badge>
                        <span className="font-mono text-[9px] text-muted-foreground">
                          {String(index + 1).padStart(2, "0")} · {link.type}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <h4 className="text-sm font-semibold leading-6 text-foreground">
                          {link.title}
                        </h4>
                        <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                          {link.summary}
                        </p>

                        <div className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                            Cocok untuk
                          </p>
                          <p className="mt-1 text-[11px] font-medium leading-5 text-foreground">
                            {link.for}
                          </p>
                        </div>

                        <details className="group/details mt-3 rounded-lg border border-transparent text-xs">
                          <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium text-muted-foreground transition hover:text-foreground [&::-webkit-details-marker]:hidden">
                            <ChevronDown className="size-3.5 transition-transform group-open/details:rotate-180" />
                            Cara menghubungkan ke lab
                          </summary>
                          <p className="mt-2 rounded-lg bg-muted/50 p-3 leading-5 text-muted-foreground">
                            {link.labUse}
                          </p>
                        </details>

                        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3.5">
                          <span className="truncate font-mono text-[10px] text-muted-foreground">
                            {hostname}
                          </span>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-foreground transition hover:gap-1.5"
                          >
                            Buka
                            <ArrowUpRight className="size-3.5" />
                          </a>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
            <span className="mx-auto flex size-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
              <BookOpen className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-sm font-semibold text-foreground">
              Tidak ada sumber yang cocok
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
              Coba kata kunci lain seperti “Docker”, “Nginx”, atau “Terraform”.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline"
            >
              <ExternalLink className="size-3.5" />
              Tampilkan semua referensi
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
