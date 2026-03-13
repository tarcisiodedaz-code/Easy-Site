"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function FormRedefinirSenha() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function processRecoveryToken() {
      // Primeiro, tenta pegar uma sessão existente
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
        return;
      }

      // Se não há sessão, tenta processar o hash da URL
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash && hash.includes("access_token") && hash.includes("type=recovery")) {
        const params = new URLSearchParams(hash.replace("#", ""));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          // Tenta criar a sessão com os tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            setReady(true);
            // Limpa o hash da URL para não ficar exposto
            window.history.replaceState(null, "", window.location.pathname);
            return;
          }
        }
      }

      // Se chegou aqui, não conseguiu criar sessão
      setError("Link inválido ou expirado. Solicite um novo link em Esqueci minha senha.");
    }

    processRecoveryToken();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  if (!ready && !error) {
    return (
      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center text-zinc-400">
        Carregando...
      </div>
    );
  }

  if (error && !password) {
    return (
      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <p className="text-red-400">{error}</p>
        <a
          href="/esqueci-senha"
          className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline"
        >
          Solicitar novo link
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
          Nova senha
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
          placeholder="Mínimo 6 caracteres"
        />
      </div>
      <div className="mt-4">
        <label htmlFor="confirm" className="block text-sm font-medium text-zinc-300">
          Confirmar nova senha
        </label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
          placeholder="Repita a senha"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-[var(--accent)] py-3 font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Salvar e entrar"}
      </button>
    </form>
  );
}
