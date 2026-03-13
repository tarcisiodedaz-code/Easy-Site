"use client";

import { useState, Fragment } from "react";
import Image from "next/image";
import {
  criarCategoriaProduto,
  atualizarCategoriaProduto,
  excluirCategoriaProduto,
  type CategoriaProdutoAdmin,
} from "./actions";
import { slugify } from "@/lib/produtos-completo";

type Props = { categorias: CategoriaProdutoAdmin[] };

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <span className="text-sm text-zinc-300">{label}</span>
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--accent)]" : "bg-zinc-700"
        }`}
      >
        <div
          className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
    </label>
  );
}

const emptyForm = {
  nome: "",
  descricao: "",
  slug: "",
  ativo: true,
  icon_url: "",
  parent_id: "",
};

export function ListaCategoriasProdutoAdmin({ categorias: initial }: Props) {
  const [categorias, setCategorias] = useState(initial);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const categoriasPai = categorias.filter((c) => !c.parent_id);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getFilhos(parentId: string) {
    return categorias.filter((c) => c.parent_id === parentId);
  }

  async function handleUploadIcon(file: File, field: "icon_url") {
    setUploadingIcon(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", "categorias");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setForm((f) => ({ ...f, [field]: data.url }));
      else setMsg({ ok: false, text: data.erro ?? "Falha no upload." });
    } catch {
      setMsg({ ok: false, text: "Erro ao enviar ícone." });
    } finally {
      setUploadingIcon(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const fd = new FormData();
    fd.set("nome", form.nome);
    fd.set("descricao", form.descricao);
    fd.set("slug", form.slug || slugify(form.nome));
    fd.set("ativo", String(form.ativo));
    fd.set("icon_url", form.icon_url);
    fd.set("parent_id", form.parent_id);
    const res = editId
      ? await atualizarCategoriaProduto(editId, fd)
      : await criarCategoriaProduto(fd);
    setLoading(false);
    if (res.ok) {
      setForm(emptyForm);
      setEditId(null);
      setMsg({ ok: true, text: editId ? "Categoria atualizada." : "Categoria criada." });
      window.location.reload();
    } else {
      setMsg({ ok: false, text: res.erro ?? "Erro." });
    }
  }

  function openEdit(c: CategoriaProdutoAdmin) {
    setEditId(c.id);
    setForm({
      nome: c.nome,
      descricao: c.descricao ?? "",
      slug: c.slug ?? "",
      ativo: c.ativo !== false,
      icon_url: c.icon_url ?? "",
      parent_id: c.parent_id ?? "",
    });
    setMsg(null);
  }

  function cancelEdit() {
    setEditId(null);
    setForm(emptyForm);
  }

  async function handleExcluir(id: string, nome: string) {
    if (!confirm(`Excluir a categoria "${nome}"?`)) return;
    setLoading(true);
    setMsg(null);
    const res = await excluirCategoriaProduto(id);
    setLoading(false);
    if (res.ok) {
      setCategorias((prev) => prev.filter((c) => c.id !== id));
      if (editId === id) cancelEdit();
      setMsg({ ok: true, text: "Categoria excluída." });
    } else {
      setMsg({ ok: false, text: res.erro ?? "Erro ao excluir." });
    }
  }

  return (
    <div className="space-y-8">
      {msg && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            msg.ok ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-200" : "border-red-900/50 bg-red-950/30 text-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          {editId ? "Editar categoria" : "Nova categoria"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Nome</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({ ...f, nome: v, slug: f.slug || slugify(v) }));
              }}
              required
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Slug (URL)</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="categoria-exemplo"
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500"
            />
            <p className="mt-1 text-xs text-zinc-500">Deixe vazio para gerar automaticamente com base no nome.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-zinc-400">Descrição</label>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Categoria Pai</label>
            <select
              value={form.parent_id}
              onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-3 py-2 text-white"
            >
              <option value="">Nenhuma (categoria raiz)</option>
              {categoriasPai
                .filter((c) => c.id !== editId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
            </select>
            <p className="mt-1 text-xs text-zinc-500">Se selecionar uma, esta vira subcategoria.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Ícone</label>
            <p className="mb-2 text-xs text-amber-400/90">Dimensão recomendada: 64×64 px (ícones de menu).</p>
            <div className="flex flex-wrap items-center gap-2">
              {form.icon_url ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-zinc-800">
                  <Image src={form.icon_url} alt="" fill className="object-cover" unoptimized />
                </div>
              ) : null}
              <label className="cursor-pointer rounded-lg border border-[var(--border)] bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingIcon}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadIcon(f, "icon_url");
                  }}
                />
                {uploadingIcon ? "Enviando…" : "Upload ícone"}
              </label>
              <input
                type="url"
                value={form.icon_url}
                onChange={(e) => setForm((f) => ({ ...f, icon_url: e.target.value }))}
                placeholder="URL do ícone"
                className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 sm:col-span-2">
            <Switch label="Ativo" checked={form.ativo} onChange={(v) => setForm((f) => ({ ...f, ativo: v }))} />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {loading ? "Salvando…" : editId ? "Salvar" : "Criar"}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-zinc-900/50">
              <th className="w-10 p-3 font-medium text-zinc-300"></th>
              <th className="p-3 font-medium text-zinc-300">Ícone</th>
              <th className="p-3 font-medium text-zinc-300">Nome</th>
              <th className="p-3 font-medium text-zinc-300">Slug</th>
              <th className="p-3 font-medium text-zinc-300">Pai</th>
              <th className="p-3 font-medium text-zinc-300">Status</th>
              <th className="p-3 font-medium text-zinc-300 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categoriasPai.map((pai) => {
              const filhos = getFilhos(pai.id);
              const expandido = expandedIds.has(pai.id);
              return (
                <Fragment key={pai.id}>
                  <tr className="border-b border-[var(--border)]/80 hover:bg-zinc-800/30">
                    <td className="p-3">
                      {filhos.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(pai.id)}
                          className="flex h-8 w-8 items-center justify-center rounded text-zinc-400 hover:bg-zinc-700 hover:text-white"
                          aria-expanded={expandido}
                          title={expandido ? "Recolher" : "Expandir"}
                        >
                          <svg
                            className={`h-5 w-5 transition-transform ${expandido ? "rotate-90" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ) : (
                        <span className="inline-block w-8" />
                      )}
                    </td>
                    <td className="p-3">
                      {pai.icon_url ? (
                        <div className="relative h-8 w-8 overflow-hidden rounded bg-zinc-800">
                          <Image src={pai.icon_url} alt="" fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="p-3 font-medium text-white">{pai.nome}</td>
                    <td className="p-3 text-zinc-400">{pai.slug || "—"}</td>
                    <td className="p-3 text-zinc-400">—</td>
                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          pai.ativo !== false ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-600/50 text-zinc-400"
                        }`}
                      >
                        {pai.ativo !== false ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(pai)}
                        className="mr-2 rounded px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluir(pai.id, pai.nome)}
                        disabled={loading}
                        className="rounded px-2 py-1 text-red-400 hover:bg-red-950/30 disabled:opacity-50"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                  {expandido &&
                    filhos.map((c) => (
                      <tr key={c.id} className="border-b border-[var(--border)]/80 bg-zinc-900/40 hover:bg-zinc-800/40">
                        <td className="p-3" />
                        <td className="p-3 pl-6">
                          {c.icon_url ? (
                            <div className="relative h-8 w-8 overflow-hidden rounded bg-zinc-800">
                              <Image src={c.icon_url} alt="" fill className="object-cover" unoptimized />
                            </div>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="p-3 pl-6 font-medium text-white">{c.nome}</td>
                        <td className="p-3 text-zinc-400">{c.slug || "—"}</td>
                        <td className="p-3 text-zinc-400">{pai.nome}</td>
                        <td className="p-3">
                          <span
                            className={`rounded px-2 py-0.5 text-xs ${
                              c.ativo !== false ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-600/50 text-zinc-400"
                            }`}
                          >
                            {c.ativo !== false ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="mr-2 rounded px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluir(c.id, c.nome)}
                            disabled={loading}
                            className="rounded px-2 py-1 text-red-400 hover:bg-red-950/30 disabled:opacity-50"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {categoriasPai.length === 0 && (
          <div className="p-8 text-center text-zinc-500">Nenhuma categoria ainda. Crie uma acima.</div>
        )}
      </div>
    </div>
  );
}
