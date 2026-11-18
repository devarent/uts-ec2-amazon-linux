"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CornerDownLeft,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
  source?: "openai" | "local";
};

const suggestions = [
  "Kenapa port 3000 tidak dibuka ke publik?",
  "Kapan sebaiknya memilih RDS?",
  "Apa fungsi health check?",
  "Bagaimana urutan deployment yang aman?",
];

const greeting: Message = {
  role: "assistant",
  content:
    "Halo! Saya asisten lab EC2 ini. Tanya apa saja soal langkah deploy, Docker, Nginx, Terraform, atau CI/CD. Tanpa OPENAI_API_KEY saya menjawab dari knowledge base lokal.",
};

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;

    setError(null);
    setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", content: question }]);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as {
        reply?: string;
        source?: "openai" | "local";
      };

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.reply ??
            "Maaf, saya tidak mendapat jawaban. Cek log container: docker compose logs app",
          source: data.source,
        },
      ]);
    } catch {
      setError("Gagal menghubungi /api/ai. Pastikan container sehat.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Koneksi ke API gagal. Di EC2, cek `docker compose ps` dan `docker compose logs app`.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-foreground/[0.05]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm">
            <Bot className="size-4.5" aria-hidden="true" />
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Asisten Lab</p>
            <p className="text-[11px] text-muted-foreground">
              Bantuan EC2 · AI opsional
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-background font-mono text-[9px]">
          POST /api/ai
        </Badge>
      </div>

      <div
        ref={listRef}
        aria-live="polite"
        className="scrollbar-thin h-[340px] space-y-4 overflow-y-auto bg-muted/20 px-4 py-5 sm:h-[380px] sm:px-5"
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "flex-row-reverse" : "flex-row",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full ring-1",
                message.role === "user"
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-background text-muted-foreground ring-border",
              )}
              aria-hidden="true"
            >
              {message.role === "user" ? (
                <UserRound className="size-3.5" />
              ) : (
                <Bot className="size-3.5" />
              )}
            </span>
            <div
              className={cn(
                "max-w-[88%] rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm",
                message.role === "user"
                  ? "rounded-tr-md border-primary bg-primary text-primary-foreground"
                  : "rounded-tl-md border-border bg-card text-foreground",
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.role === "assistant" && message.source ? (
                <p className="mt-2 flex items-center gap-1.5 border-t border-border pt-2 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="size-3" aria-hidden="true" />
                  Sumber: {message.source === "local" ? "panduan lokal" : "AI"}
                </p>
              ) : null}
            </div>
          </div>
        ))}

        {busy ? (
          <div className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border">
              <Bot className="size-3.5" aria-hidden="true" />
            </span>
            <div
              className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3.5"
              aria-label="Asisten sedang menjawab"
            >
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-border bg-card px-4 py-4 sm:px-5">
        <div className="mb-3">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Pertanyaan cepat
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void send(suggestion)}
                disabled={busy}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-left text-[10px] font-medium leading-4 text-muted-foreground transition hover:border-ring hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
          className="flex items-stretch gap-2"
        >
          <label htmlFor="chat-input" className="sr-only">
            Pertanyaan
          </label>
          <Input
            id="chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={1000}
            placeholder="Tulis pertanyaan tentang lab…"
            className="h-11 flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={busy || !input.trim()}
            className="size-11"
            aria-label="Kirim pertanyaan"
          >
            {busy ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
        {error ? (
          <p className="mt-2 text-[11px] text-rose-600" role="alert">
            {error}
          </p>
        ) : (
          <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="size-3" />
            Jawaban AI bisa keliru. Verifikasi ke dokumentasi resmi.
            <CornerDownLeft className="ml-auto hidden size-3 sm:block" />
          </p>
        )}
      </div>
    </div>
  );
}
