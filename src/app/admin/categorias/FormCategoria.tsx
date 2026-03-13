"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { criarCategoria, atualizarCategoria } from "./actions";
import { UploadPreview } from "@/app/admin/customizacao/UploadPreview";
import type { CategoriaComItens } from "@/lib/categorias";

type IconOption = { value: string; label: string };

type Props = {
  icones: readonly IconOption[];
  categoria?: CategoriaComItens | null;
  showIconUpload?: boolean;
};

export function FormCategoria({ icones, categoria, showIconUpload = true }: Props) {
  const router = useRouter();
  const isEdit = !!categoria;
  const [nome, setNome] = useState(categoria?.nome ?? "");
  const [href, setHref] = useState(categoria?.href ?? "");
  const [icon, setIcon] = useState(categoria?.icon ?? "pages");
  const [iconUrl, setIconUrl] = useState<string | null>(categoria?.icon_url ?? null);
  const [ordem, setOrdem] = useState(categoria?.ordem ?? 0);
  const [itens, setItens] = useState<{ label: string; href: string }[]>(
    categoria?.itens?.map((i) => ({ label: i.label, href: i.href })) ?? []
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    if (isEdit && categoria) {
      const formData = new FormData();
      formData.set("nome", nome);
      formData.set("href", href);
      formData.set("icon", icon);
      if (iconUrl) formData.set("icon_url", iconUrl);
      formData.set("ordem", String(ordem));
      formData.set("itens", JSON.stringify(itens));
      const res = await atualizarCategoria(categoria.id, formData);
      setSalvando(false);
      if (res.ok) {
        router.push("/admin/categorias");
        router.refresh();
      } else setErro(res.erro ?? "Erro ao salvar.");
    } else {
      const formData = new FormData();
      formData.set("nome", nome);
      formData.set("href", href);
      formData.set("icon", icon);
      if (iconUrl) formData.set("icon_url", iconUrl);
      formData.set("ordem", String(ordem));
      const res = await criarCategoria(formData);
      setSalvando(false);
      if (res.ok && res.id) {
        if (itens.length > 0) {
          const formData2 = new FormData();
          formData2.set("nome", nome);
          formData2.set("href", href);
          formData2.set("icon", icon);
          if (iconUrl) formData2.set("icon_url", iconUrl);
          formData2.set("ordem", String(ordem));
          formData2.set("itens", JSON.stringify(itens));
          await atualizarCategoria(res.id, formData2);
        }
        router.push("/admin/categorias");
        router.refresh();
      } else setErro(res.erro ?? "Erro ao criar.");
    }
  }

  function addItem() {
    setItens((prev) => [...prev, { label: "", href: "/categorias/ofertas" }]);
  }
  function removeItem(i: number) {
    setItens((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateItem(i: number, field: "label" | "href", value: string) {
    setItens((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      {erro && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-200">
          {erro}
        </div>
      )}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">Nome (ex: PÁGINAS, OFERTAS)</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Link direto (deixe vazio para usar dropdown)
        </label>
        <input
          type="text"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="Ex: /categorias/ofertas ou /sobre"
          className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">Ícone (preset)</label>
        <select
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white"
        >
          {icones.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {showIconUpload && (
        <UploadPreview
          value={iconUrl}
          onChange={setIconUrl}
          folder="icons"
          label="Ícone customizado (envie a imagem, não use URL)"
          recommendedSize="64×64px para ícones de menu"
        />
      )}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">Ordem (número)</label>
        <input
          type="number"
          min={0}
          value={ordem}
          onChange={(e) => setOrdem(Number(e.target.value))}
          className="w-24 rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white"
        />
      </div>
      {!href && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">Itens do dropdown</label>
            <button type="button" onClick={addItem} className="text-sm text-[var(--accent)] hover:underline">
              + Adicionar item
            </button>
          </div>
          <div className="space-y-2">
            {itens.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateItem(i, "label", e.target.value)}
                  placeholder="Texto do link"
                  className="flex-1 rounded border border-[var(--border)] bg-zinc-800 px-3 py-2 text-sm text-white"
                />
                <input
                  type="text"
                  value={item.href}
                  onChange={(e) => updateItem(i, "href", e.target.value)}
                  placeholder="/categorias/ofertas"
                  className="flex-1 rounded border border-[var(--border)] bg-zinc-800 px-3 py-2 text-sm text-white"
                />
                <button type="button" onClick={() => removeItem(i)} className="rounded p-2 text-red-400 hover:bg-red-950/30">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-[var(--accent)] px-5 py-2.5 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {salvando ? "Salvando…" : isEdit ? "Salvar" : "Criar categoria"}
        </button>
        <Link
          href="/admin/categorias"
          className="rounded-lg border border-[var(--border)] px-5 py-2.5 font-medium text-zinc-300 hover:bg-zinc-800"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
