"use client";

import { useState, useTransition } from "react";
import { salvarConfigPagBank, testarConexaoPagBank } from "./actions";

export function PagBankClient({
  initialToken,
  initialSandbox,
  initialInstallmentsLimit,
  initialInterestFreeInstallments,
  initialSoftDescriptor,
}: {
  initialToken: string;
  initialSandbox: boolean;
  initialInstallmentsLimit: number;
  initialInterestFreeInstallments: number;
  initialSoftDescriptor: string;
}) {
  const [token, setToken] = useState(initialToken);
  const [sandbox, setSandbox] = useState(initialSandbox);
  const [installmentsLimit, setInstallmentsLimit] = useState(initialInstallmentsLimit);
  const [interestFree, setInterestFree] = useState(initialInterestFreeInstallments);
  const [softDescriptor, setSoftDescriptor] = useState(initialSoftDescriptor);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setMsg(null);
    startTransition(async () => {
      const r = await salvarConfigPagBank({
        token,
        sandbox,
        installments_limit: installmentsLimit,
        interest_free_installments: interestFree,
        soft_descriptor: softDescriptor,
      });
      setMsg(r.ok ? { tipo: "ok", texto: "Salvo com sucesso." } : { tipo: "erro", texto: r.erro ?? "Erro ao salvar." });
    });
  }

  function handleTest() {
    setMsg(null);
    startTransition(async () => {
      const r = await testarConexaoPagBank();
      setMsg(r.ok ? { tipo: "ok", texto: r.mensagem } : { tipo: "erro", texto: r.mensagem });
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-zinc-400">Token (Bearer)</label>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Cole aqui o token (sem escrever 'Bearer')"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
        />
        <p className="mt-1 text-xs text-zinc-500">Fica salvo no banco em `loja_config` e usado no servidor.</p>
      </div>

      <div className="flex items-center gap-3">
        <input id="pagbank-sandbox" type="checkbox" checked={sandbox} onChange={(e) => setSandbox(e.target.checked)} />
        <label htmlFor="pagbank-sandbox" className="text-sm text-zinc-300">
          Usar Sandbox
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Limite de parcelas</label>
          <input
            type="number"
            min={1}
            max={12}
            value={installmentsLimit}
            onChange={(e) => setInstallmentsLimit(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Parcelas sem juros (vendedor)</label>
          <input
            type="number"
            min={0}
            max={12}
            value={interestFree}
            onChange={(e) => setInterestFree(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
          />
          <p className="mt-1 text-xs text-zinc-500">Deixe 0 para repassar juros ao cliente (padrão).</p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-400">Soft descriptor (fatura)</label>
        <input
          value={softDescriptor}
          onChange={(e) => setSoftDescriptor(e.target.value)}
          maxLength={17}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
        />
      </div>

      {msg && (
        <div
          className={`rounded-lg p-3 text-sm ${
            msg.tipo === "ok"
              ? "border border-emerald-900/50 bg-emerald-950/30 text-emerald-200"
              : "border border-red-900/50 bg-red-950/30 text-red-200"
          }`}
        >
          {msg.texto}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={handleTest}
          disabled={isPending}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          Testar conexão
        </button>
      </div>
    </div>
  );
}

