import { redirect } from "next/navigation";
import AuthForm from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export const metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await getCurrentUser()) redirect("/dashboard#pipeline");
  const params = await searchParams;
  const nextPath = Array.isArray(params.next) ? params.next[0] : params.next;

  return (
    <AuthShell footer="Akses aman ke workspace lab. Jangan gunakan kata sandi yang dipakai untuk layanan lain.">
      <AuthForm mode="login" nextPath={nextPath} />
    </AuthShell>
  );
}
