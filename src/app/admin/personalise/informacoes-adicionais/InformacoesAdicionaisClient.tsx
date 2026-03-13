"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/RichTextEditor";
import { salvarInformacoesAdicionais } from "../actions";

type Props = {
  htmlInicial: string;
};

export function InformacoesAdicionaisClient({ htmlInicial }: Props) {
  const [html, setHtml] = useState(htmlInicial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function handleSalvar() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await salvarInformacoesAdicionais(html || null);
      if (res.ok) {
        setMsg({ tipo: "ok", texto: "Informações adicionais salvas. Elas aparecem em todas as páginas de produto." });
      } else {
        setMsg({ tipo: "erro", texto: res.erro || "Erro ao salvar" });
      }
    } catch {
      setMsg({ tipo: "erro", texto: "Erro ao salvar" });
    } finally {
      setSaving(false);
    }
  }

  async function handleExcluir() {
    if (!confirm("Excluir o conteúdo de Informações adicionais? A seção deixará de aparecer em todos os produtos.")) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await salvarInformacoesAdicionais(null);
      if (res.ok) {
        setHtml("");
        setMsg({ tipo: "ok", texto: "Informações adicionais excluídas." });
      } else {
        setMsg({ tipo: "erro", texto: res.erro || "Erro ao excluir" });
      }
    } catch {
      setMsg({ tipo: "erro", texto: "Erro ao excluir" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div
          className={`rounded-lg border px-4 py-3 ${
            msg.tipo === "ok"
              ? "border-emerald-800 bg-emerald-950/30 text-emerald-200"
              : "border-red-800 bg-red-950/30 text-red-200"
          }`}
        >
          {msg.texto}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800/50 px-6 pb-6 pt-4">
        <p className="mb-4 text-sm text-zinc-400">
          Este conteúdo aparece na seção &quot;Informações adicionais&quot; em <strong>todas</strong> as páginas de produto. Use o mesmo padrão da descrição (texto, listas, negrito). Deixe em branco para não exibir a seção.
        </p>
        <RichTextEditor value={html} onChange={setHtml} minHeight="200px" />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSalvar}
            disabled={saving}
            className="rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
          <button
            type="button"
            onClick={handleExcluir}
            disabled={saving}
            className="rounded-lg border border-zinc-600 bg-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-600 disabled:opacity-50"
          >
            Excluir conteúdo
          </button>
        </div>
      </div>
    </div>
  );
}
