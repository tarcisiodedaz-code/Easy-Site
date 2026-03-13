"use client";

import { useState } from "react";

type Props = {
  initialPublicKey: string;
  initialAccessToken: string;
  initialSandbox: boolean;
};

export function PagamentosClient({
  initialPublicKey,
  initialAccessToken,
  initialSandbox,
}: Props) {
  const [publicKey, setPublicKey] = useState(initialPublicKey);
  const [accessToken, setAccessToken] = useState(initialAccessToken);
  const [sandbox, setSandbox] = useState(initialSandbox);
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMsg(null);
    const { salvarConfigMercadoPago } = await import("./actions");
    const res = await salvarConfigMercadoPago({ publicKey, accessToken, sandbox });
    setSalvando(false);
    if (res.ok) {
      setMsg({ tipo: "ok", texto: "Configurações salvas." });
    } else {
      setMsg({ tipo: "erro", texto: res.erro ?? "Erro ao salvar." });
    }
  }

  async function handleTestar() {
    setTestando(true);
    setMsg(null);
    const { testarConexao } = await import("./actions");
    const res = await testarConexao();
    setTestando(false);
    if (res.ok) {
      setMsg({ tipo: "ok", texto: res.mensagem });
    } else {
      setMsg({ tipo: "erro", texto: res.mensagem });
    }
  }

  return (
    <form onSubmit={handleSalvar} className="space-y-6">
      {msg && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            msg.tipo === "ok"
              ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-200"
              : "border-red-900/50 bg-red-950/30 text-red-200"
          }`}
        >
          {msg.texto}
        </div>
      )}

      <div>
        <label htmlFor="publicKey" className="mb-1 block text-sm font-medium text-zinc-300">
          Public Key
        </label>
        <input
          id="publicKey"
          type="text"
          value={publicKey}
          onChange={(e) => setPublicKey(e.target.value)}
          placeholder="APP_USR-..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <p className="mt-1 text-xs text-zinc-500">Usada no frontend para tokenização do cartão. Pode ser exposta.</p>
      </div>

      <div>
        <label htmlFor="accessToken" className="mb-1 block text-sm font-medium text-zinc-300">
          Access Token
        </label>
        <input
          id="accessToken"
          type="password"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder="APP_USR-..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <p className="mt-1 text-xs text-zinc-500">Usado apenas no servidor. Nunca é enviado ao navegador.</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">Modo de operação</label>
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="modo"
              checked={!sandbox}
              onChange={() => setSandbox(false)}
              className="rounded-full border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-zinc-300">Produção</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="modo"
              checked={sandbox}
              onChange={() => setSandbox(true)}
              className="rounded-full border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-zinc-300">Sandbox (teste)</span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={handleTestar}
          disabled={testando}
          className="rounded-lg border border-zinc-600 px-5 py-2.5 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
        >
          {testando ? "Testando…" : "Testar conexão com Mercado Pago"}
        </button>
      </div>
    </form>
  );
}
