import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { isAdminLoggedIn } from "@/lib/auth-admin";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  if (await isAdminLoggedIn()) redirect("/admin");
  const { from } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
        <h1 className="text-xl font-bold text-white">Acesso administrativo</h1>
        <p className="mt-2 text-sm text-zinc-400">Easy Games — Controle</p>
        <LoginForm redirectTo={from || "/admin"} />
      </div>
    </div>
  );
}
