"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { signUpSchema, signInSchema, type SignUpInput, type SignInInput } from "@/lib/auth/validation";

type LoginFormProps = { redirect: string };

export function LoginForm({ redirect }: LoginFormProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as { email: string; password: string };
    const parsed = signInSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (err) {
      setError(err.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : err.message);
      return;
    }
    window.location.href = redirect;
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as SignUpInput;
    const parsed = signUpSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setLoading(true);
    const { data: signUpData, error: err } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: undefined,
        data: {
          full_name: parsed.data.full_name,
          phone_number: parsed.data.phone_number.replace(/\D/g, "").slice(-11),
        },
      },
    });
    setLoading(false);
    if (err) {
      if (err.message?.toLowerCase().includes("rate limit") || err.message?.toLowerCase().includes("email rate limit")) {
        setError("Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente. Desative a confirmação de e-mail no Supabase (Authentication → Providers → Email).");
      } else {
        setError(err.message);
      }
      return;
    }
    // Usuário ativo sem confirmação: login automático + e-mail boas-vindas + redirecionar para Home
    if (signUpData.session) {
      try {
        await fetch("/api/email/boas-vindas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: parsed.data.email,
            full_name: parsed.data.full_name,
          }),
        });
      } catch {
        // Não bloqueia o cadastro se o e-mail falhar
      }
      setSuccess("Conta criada! Redirecionando para a página inicial...");
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
      return;
    }
    // Supabase está com "Confirm email" ativo: não retorna sessão e envia e-mail de confirmação.
    // Para corrigir: ver SUPABASE_AUTH_SETUP.md ou Dashboard → Authentication → Providers → Email → desative "Confirm email".
    setSuccess(
      "Conta criada. O sistema está exigindo confirmação de e-mail. No Supabase: Authentication → Users → localize este e-mail → abra o usuário → confirme (Confirm user). Depois faça login na aba Entrar. Para novos cadastros entrarem direto, desative \"Confirm email\" em Authentication → Providers → Email (veja SUPABASE_AUTH_SETUP.md)."
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="flex gap-2 border-b border-[var(--border)] pb-4">
        <button
          type="button"
          onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${mode === "login" ? "bg-[var(--accent)] text-white" : "text-zinc-400 hover:text-white"}`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${mode === "signup" ? "bg-[var(--accent)] text-white" : "text-zinc-400 hover:text-white"}`}
        >
          Cadastrar
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {mode === "login" ? (
        <form onSubmit={handleSignIn} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-zinc-300">
              E-mail
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-zinc-300">
              Senha
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
              placeholder="••••••••"
            />
            <p className="mt-2 text-right">
              <a href="/esqueci-senha" className="text-sm text-zinc-400 hover:text-[var(--accent)]">
                Esqueci minha senha
              </a>
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] py-3 font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} className="mt-6 space-y-4">
          <div>
            <label htmlFor="signup-name" className="block text-sm font-medium text-zinc-300">
              Nome
            </label>
            <input
              id="signup-name"
              name="full_name"
              type="text"
              required
              autoComplete="name"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-zinc-300">
              E-mail
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label htmlFor="signup-phone" className="block text-sm font-medium text-zinc-300">
              Número de contato
            </label>
            <input
              id="signup-phone"
              name="phone_number"
              type="tel"
              required
              autoComplete="tel"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
              placeholder="(79) 99999-9999"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-zinc-300">
              Senha
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] py-3 font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>
      )}
    </div>
  );
}
