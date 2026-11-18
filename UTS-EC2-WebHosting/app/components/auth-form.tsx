"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AuthFormProps = {
  mode: "login" | "register";
  nextPath?: string;
};

const ERROR_TEXT: Record<string, string> = {
  invalid_name: "Nama harus berisi 2–80 karakter.",
  invalid_email: "Masukkan alamat email yang valid.",
  weak_password: "Gunakan kata sandi minimal 12 karakter.",
  email_already_registered: "Email sudah terdaftar. Silakan masuk.",
  invalid_credentials: "Email atau kata sandi tidak cocok.",
  invalid_origin: "Permintaan tidak valid. Muat ulang halaman lalu coba lagi.",
  registration_unavailable: "Pendaftaran gagal sementara. Coba lagi sebentar.",
  authentication_unavailable: "Login gagal sementara. Coba lagi sebentar.",
};

export default function AuthForm({ mode, nextPath = "/dashboard" }: AuthFormProps) {
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        isRegister ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(
          ERROR_TEXT[payload.error ?? ""] ??
            "Permintaan tidak berhasil. Periksa koneksi database dan coba lagi.",
        );
        return;
      }

      const destination =
        nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/dashboard";
      window.location.assign(destination);
    } catch (requestError) {
      console.error("[auth-form] request failed:", requestError);
      setError(
        "Tidak dapat menghubungi server. Pastikan aplikasi dan database aktif.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-foreground/[0.04]">
      <div className="border-b border-border bg-muted/40 px-6 py-6">
        <div className="flex items-start gap-3.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm">
            <LockKeyhole className="size-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {isRegister ? "Workspace EC2 Lab" : "Akses workspace"}
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              {isRegister ? "Buat akun lab" : "Masuk ke workspace"}
            </h1>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {isRegister
            ? "Simpan konfigurasi deployment dan progres checklist secara pribadi di PostgreSQL."
            : "Lanjutkan konfigurasi EC2, database, dan pipeline yang sudah tersimpan."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5 px-6 py-6">
        {isRegister ? (
          <div className="space-y-2">
            <Label htmlFor="auth-name">Nama</Label>
            <Input
              id="auth-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={80}
              autoComplete="name"
              required
              placeholder="Nama lengkap"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={254}
            autoComplete="email"
            required
            placeholder="nama@email.com"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="auth-password">Kata sandi</Label>
            {isRegister ? (
              <span className="text-[11px] text-muted-foreground">Min. 12 karakter</span>
            ) : null}
          </div>
          <div className="relative">
            <Input
              id="auth-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={isRegister ? 12 : undefined}
              maxLength={128}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              className="pr-11"
              placeholder={isRegister ? "Buat kata sandi yang kuat" : "Masukkan kata sandi"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive" className="py-3">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={busy}
          className="w-full"
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin" />
              Memproses…
            </>
          ) : (
            <>
              {isRegister ? "Buat workspace" : "Masuk ke workspace"}
              <ArrowRight />
            </>
          )}
        </Button>

        <p className="flex items-start gap-2 text-[11px] leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Kata sandi di-hash di server. Jangan gunakan kata sandi yang sama dengan
          layanan lain.
        </p>
      </form>

      <div className="border-t border-border bg-muted/30 px-6 py-4 text-center">
        <p className="text-sm text-muted-foreground">
          {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-semibold text-foreground underline decoration-border underline-offset-4 transition hover:decoration-foreground"
          >
            {isRegister ? "Masuk" : "Buat akun"}
          </Link>
        </p>
      </div>
    </div>
  );
}
