import { redirect } from "next/navigation";
import AuthForm from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser } from "@/lib/auth";

type RegisterPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export const metadata = { title: "Buat akun" };

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  if (await getCurrentUser()) redirect("/dashboard#pipeline");
  const params = await searchParams;
  const nextPath = Array.isArray(params.next) ? params.next[0] : params.next;

  return (
    <AuthShell footer="Buat kata sandi unik dengan minimal 12 karakter. Progres checklist akan tersimpan di akun ini.">
      <AuthForm mode="register" nextPath={nextPath ?? "/dashboard#pipeline"} />
    </AuthShell>
  );
}
