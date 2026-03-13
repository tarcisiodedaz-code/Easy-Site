"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { redirectTo: string };

export function LoginForm({ redirectTo }: Props) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) {
      router.push(redirectTo);
      router.refresh();
    } else {
      setErro(data.erro ?? "Senha incorreta.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {erro && (
        <p className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {erro}
        </p>
      )}
      <div>
        <label htmlFor="senha" className="mb-2 block text-sm text-zinc-400">
          Senha
        </label>
        <input
          id="senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          autoFocus
          className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--accent)] py-2.5 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
