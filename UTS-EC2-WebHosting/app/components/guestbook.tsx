"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Database,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Entry = {
  id: number;
  name: string;
  message: string;
  created_at: string;
};

type ApiPayload = {
  entries?: Entry[];
  entry?: Entry;
  error?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  database_not_configured:
    "Database belum dikonfigurasi. Isi DATABASE_URL di .env lalu restart app.",
  database_unavailable:
    "Database belum siap. Tunggu beberapa detik lalu coba lagi.",
  name_too_short: "Nama minimal 2 karakter.",
  message_too_short: "Pesan minimal 3 karakter.",
  invalid_json: "Format permintaan tidak valid.",
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function messageFor(error: unknown) {
  const code = error instanceof Error ? error.message : "unknown";
  return ERROR_MESSAGES[code] ?? "Terjadi kesalahan. Coba lagi.";
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Guestbook() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/guestbook", { cache: "no-store" });
      const payload = (await response.json()) as ApiPayload;
      if (!response.ok) throw new Error(payload.error ?? "load_failed");
      setEntries(payload.entries ?? []);
      setError(null);
    } catch (loadError) {
      setError(messageFor(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    setSending(true);
    setNotice(null);
    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      const payload = (await response.json()) as ApiPayload;
      if (!response.ok) throw new Error(payload.error ?? "submit_failed");

      if (payload.entry) {
        setEntries((current) => [payload.entry as Entry, ...current]);
      }
      setName("");
      setMessage("");
      setError(null);
      setNotice("Pesan tersimpan di PostgreSQL.");
    } catch (submitError) {
      setError(messageFor(submitError));
    } finally {
      setSending(false);
    }
  }

  const status = loading
    ? { label: "Menghubungkan…", variant: "outline" as const }
    : error
      ? { label: "Database bermasalah", variant: "destructive" as const }
      : { label: "PostgreSQL tersambung", variant: "success" as const };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/30 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm">
            <MessageSquarePlus className="size-4.5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Buku tamu</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Data langsung dari PostgreSQL · tersimpan persisten
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className={cn(loading && "animate-spin")} />
              Coba lagi
            </Button>
          ) : null}
          <Badge variant={status.variant} className="gap-1.5">
            <span
              className={cn(
                "size-1.5 rounded-full",
                loading
                  ? "bg-muted-foreground"
                  : error
                    ? "bg-rose-500"
                    : "bg-emerald-500",
              )}
            />
            {status.label}
          </Badge>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.6fr)_auto]">
            <div>
              <label className="sr-only" htmlFor="guestbook-name">
                Nama
              </label>
              <Input
                id="guestbook-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                placeholder="Nama"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="sr-only" htmlFor="guestbook-message">
                Pesan
              </label>
              <Textarea
                id="guestbook-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={500}
                rows={1}
                placeholder="Tulis pesan singkat…"
                className="min-h-10 resize-y py-2.5 leading-5"
              />
            </div>
            <Button
              type="submit"
              disabled={sending || !name.trim() || !message.trim()}
              className="h-10"
            >
              {sending ? <Loader2 className="animate-spin" /> : <Send />}
              {sending ? "Menyimpan…" : "Kirim"}
            </Button>
          </div>

          {error ? (
            <Alert variant="destructive" className="py-3">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {notice ? (
            <Alert variant="success" className="py-3">
              <Sparkles />
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          ) : null}
        </form>

        <div className="scrollbar-thin mt-5 max-h-[23rem] space-y-3 overflow-y-auto pr-1">
          {loading && entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 py-10 text-center">
              <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Memuat pesan…</p>
            </div>
          ) : null}

          {!loading && entries.length === 0 && !error ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 py-10 text-center">
              <MessageSquarePlus className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Belum ada pesan. Jadilah yang pertama menulis.
              </p>
            </div>
          ) : null}

          {entries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-semibold text-primary-foreground">
                  {initials(entry.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {entry.name}
                    </p>
                    <time
                      className="shrink-0 text-[10px] text-muted-foreground"
                      dateTime={entry.created_at}
                    >
                      {formatDate(entry.created_at)}
                    </time>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                    {entry.message}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 font-mono text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Database className="size-3" />
            POST /api/guestbook
          </span>
          <span>volume Docker db-data · port database tidak dipublikasikan</span>
        </div>
      </div>
    </div>
  );
}
