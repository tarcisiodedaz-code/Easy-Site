"use client";

import { useState, useEffect } from "react";
import { getConfigHomeAdmin, salvarConfigHome } from "./actions";
import type { ConfigHome, SecaoVitrine } from "@/lib/config-home";

const SECOES: { id: SecaoVitrine; label: string; desc: string }[] = [
  { id: "lancamentos", label: "Lançamentos", desc: "Automaticamente os últimos produtos cadastrados (ordenados por data)." },
  { id: "mais_vendidos", label: "Mais Vendidos", desc: "Produtos com mais vendas (pedidos pagos/entregues). Sem vendas, usa a marcação Mais Vendido." },
  { id: "destaques", label: "Destaques por Categoria", desc: "Jogos marcados como Em Destaque na listagem de produtos." },
];

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const out = [...arr];
  const [removed] = out.splice(from, 1);
  out.splice(to, 0, removed);
  return out;
}

export function VitrineConfigClient() {
  const [config, setConfig] = useState<ConfigHome | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  useEffect(() => {
    getConfigHomeAdmin().then((c) => {
      setConfig(c ?? { ordem_secoes: ["lancamentos", "mais_vendidos", "destaques"] });
      setLoading(false);
    });
  }, []);

  async function handleSalvar() {
    if (!config) return;
    setSaving(true);
    setMensagem(null);
    const res = await salvarConfigHome(config);
    setSaving(false);
    if (res.ok) {
      setMensagem({ tipo: "ok", texto: "Ordem salva. A home foi atualizada." });
    } else {
      setMensagem({ tipo: "erro", texto: res.erro ?? "Erro ao salvar." });
    }
  }

  function move(secao: SecaoVitrine, dir: "up" | "down") {
    if (!config) return;
    const idx = config.ordem_secoes.indexOf(secao);
    if (idx === -1) return;
    const next = dir === "up" ? moveItem(config.ordem_secoes, idx, idx - 1) : moveItem(config.ordem_secoes, idx, idx + 1);
    setConfig({ ordem_secoes: next });
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-8 text-center text-zinc-400">
        Carregando…
      </div>
    );
  }

  const ordem = config?.ordem_secoes ?? ["lancamentos", "mais_vendidos", "destaques"];

  return (
    <div className="space-y-6">
      {mensagem && (
        <div
          className={`rounded-lg border px-4 py-3 ${
            mensagem.tipo === "ok"
              ? "border-emerald-800 bg-emerald-950/30 text-emerald-200"
              : "border-red-800 bg-red-950/30 text-red-200"
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 overflow-hidden">
        <div className="border-b border-zinc-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Ordem das seções na Home</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Defina a ordem em que as vitrines aparecem na página inicial. Use as setas para subir ou descer cada seção.
          </p>
        </div>
        <ul className="divide-y divide-zinc-700">
          {ordem.map((secaoId, index) => {
            const meta = SECOES.find((s) => s.id === secaoId);
            if (!meta) return null;
            return (
              <li key={secaoId} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{meta.label}</p>
                  <p className="text-sm text-zinc-400">{meta.desc}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(secaoId, "up")}
                    disabled={index === 0}
                    className="rounded-lg border border-zinc-600 bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
                    title="Subir"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => move(secaoId, "down")}
                    disabled={index === ordem.length - 1}
                    className="rounded-lg border border-zinc-600 bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
                    title="Descer"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-zinc-700 px-6 py-4">
          <button
            type="button"
            onClick={handleSalvar}
            disabled={saving}
            className="rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar ordem"}
          </button>
        </div>
      </div>
    </div>
  );
}
