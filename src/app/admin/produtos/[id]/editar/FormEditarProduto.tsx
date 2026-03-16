"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { atualizarProduto } from "../../actions";
import type { ProdutoLoja } from "@/lib/supabase";
import type { CategoriaProduto } from "@/lib/produtos-completo";
import { slugify } from "@/lib/produtos-completo";
import { descricaoHtmlParaTexto } from "@/lib/scraper-playstation";

type ProdutoCompleto = ProdutoLoja & {
  descricao?: string | null;
  ativo?: boolean;
  em_destaque?: boolean;
  preco_custo?: number | null;
  preco_custo_anterior?: number | null;
  preco_promocional?: number | null;
  preco_promocional_ps4?: number | null;
  preco_promocional_ps5?: number | null;
  usar_preco_promocional_por_console?: boolean;
  gerenciar_estoque?: boolean;
  quantidade_estoque?: number;
  slug?: string | null;
  categoria_id?: string | null;
  subcategoria_id?: string | null;
  oferta_inicio?: string | null;
  oferta_fim?: string | null;
  is_lancamento?: boolean;
  disponivel_ps4?: boolean;
  disponivel_ps5?: boolean;
};

type Props = { produto: ProdutoCompleto; categorias: CategoriaProduto[]; categoriaIdsIniciais: string[] };

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
    <label className="flex cursor-pointer items-center gap-3">
      <span className="text-sm text-zinc-300">{label}</span>
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--accent)]" : "bg-zinc-700"
        }`}
      >
        <div
          className={`mt-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </div>
    </label>
  );
}

export function FormEditarProduto({ produto, categorias, categoriaIdsIniciais }: Props) {
  const router = useRouter();
  const [nome, setNome] = useState(produto.nome);
  const [descricao, setDescricao] = useState(() => {
    const d = produto.descricao ?? "";
    if (!d) return "";
    return /<[a-z][\s\S]*>/i.test(d) ? descricaoHtmlParaTexto(d) : d;
  });
  const [ativo, setAtivo] = useState(produto.ativo !== false);
  const [emDestaque, setEmDestaque] = useState(produto.em_destaque === true);
  const [imagemUrl, setImagemUrl] = useState(produto.imagem_url ?? "");
  const [precoCusto, setPrecoCusto] = useState(
    produto.preco_custo != null ? String(produto.preco_custo) : ""
  );
  const [precoCustoPs4, setPrecoCustoPs4] = useState(
    produto.preco_custo_ps4 != null ? String(produto.preco_custo_ps4) : ""
  );
  const [precoCustoPs5, setPrecoCustoPs5] = useState(
    produto.preco_custo_ps5 != null ? String(produto.preco_custo_ps5) : ""
  );
  const [preco, setPreco] = useState(String(produto.preco));
  const [precoPromocional, setPrecoPromocional] = useState(
    produto.preco_promocional != null ? String(produto.preco_promocional) : ""
  );
  const [usarPrecoPromocionalPorConsole, setUsarPrecoPromocionalPorConsole] = useState(
    produto.usar_preco_promocional_por_console === true
  );
  const [precoPromocionalPs4, setPrecoPromocionalPs4] = useState(
    produto.preco_promocional_ps4 != null ? String(produto.preco_promocional_ps4) : ""
  );
  const [precoPromocionalPs5, setPrecoPromocionalPs5] = useState(
    produto.preco_promocional_ps5 != null ? String(produto.preco_promocional_ps5) : ""
  );
  const [gerenciarEstoque, setGerenciarEstoque] = useState(produto.gerenciar_estoque === true);
  const [quantidadeEstoque, setQuantidadeEstoque] = useState(
    String(produto.quantidade_estoque ?? 0)
  );
  const [quantidadeEstoquePs4, setQuantidadeEstoquePs4] = useState(
    String(produto.quantidade_estoque_ps4 ?? 0)
  );
  const [quantidadeEstoquePs5, setQuantidadeEstoquePs5] = useState(
    String(produto.quantidade_estoque_ps5 ?? 0)
  );
  const [slug, setSlug] = useState(produto.slug ?? "");
  const [selectedCategoriaIds, setSelectedCategoriaIds] = useState<Set<string>>(
    () => new Set(categoriaIdsIniciais)
  );
  const [disponivelPs4, setDisponivelPs4] = useState(produto.disponivel_ps4 !== false);
  const [disponivelPs5, setDisponivelPs5] = useState(produto.disponivel_ps5 !== false);
  const [precoCustoBase, setPrecoCustoBase] = useState(
    produto.preco_custo_anterior != null ? String(produto.preco_custo_anterior).replace(".", ",") : ""
  );
  const [editandoCustoBase, setEditandoCustoBase] = useState(false);
  const [editandoPrecoBase, setEditandoPrecoBase] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const categoriasPai = categorias.filter((c) => !c.parent_id);
  const subcategorias = categorias.filter((c) => c.parent_id);

  function toggleCategoria(id: string) {
    setSelectedCategoriaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        const cat = categorias.find((c) => c.id === id);
        if (cat?.parent_id) next.add(cat.parent_id);
      }
      return next;
    });
  }

  async function handleUploadImage(file: File) {
    setUploadingImage(true);
    setErro(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", "produtos");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setImagemUrl(data.url);
      else setErro(data.erro ?? "Falha no upload.");
    } catch {
      setErro("Erro ao enviar imagem.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    const res = await atualizarProduto(produto.id!, {
      nome,
      imagem_url: imagemUrl.trim() || null,
      preco_original: produto.preco_original,
      preco: Number(preco.replace(",", ".")),
      preco_custo: precoCusto ? Number(precoCusto.replace(",", ".")) : null,
      preco_custo_ps4: usarPrecoPromocionalPorConsole && precoCustoPs4 ? Number(precoCustoPs4.replace(",", ".")) : null,
      preco_custo_ps5: usarPrecoPromocionalPorConsole && precoCustoPs5 ? Number(precoCustoPs5.replace(",", ".")) : null,
      preco_custo_anterior: precoCustoBase ? Number(precoCustoBase.replace(",", ".")) : null,
      preco_promocional: !usarPrecoPromocionalPorConsole && precoPromocional ? Number(precoPromocional.replace(",", ".")) : null,
      preco_promocional_ps4: usarPrecoPromocionalPorConsole && precoPromocionalPs4 ? Number(precoPromocionalPs4.replace(",", ".")) : null,
      preco_promocional_ps5: usarPrecoPromocionalPorConsole && precoPromocionalPs5 ? Number(precoPromocionalPs5.replace(",", ".")) : null,
      usar_preco_promocional_por_console: usarPrecoPromocionalPorConsole,
      descricao: descricao || null,
      ativo,
      em_destaque: emDestaque,
      gerenciar_estoque: gerenciarEstoque,
      quantidade_estoque:
        disponivelPs4 && disponivelPs5
          ? (Number(quantidadeEstoquePs4) || 0) + (Number(quantidadeEstoquePs5) || 0)
          : Number(quantidadeEstoque) || 0,
      quantidade_estoque_ps4: disponivelPs4 ? (Number(quantidadeEstoquePs4) || 0) : null,
      quantidade_estoque_ps5: disponivelPs5 ? (Number(quantidadeEstoquePs5) || 0) : null,
      slug: slug || null,
      categoria_ids: Array.from(selectedCategoriaIds),
      disponivel_ps4: disponivelPs4,
      disponivel_ps5: disponivelPs5,
    });
    setSalvando(false);
    if (res.ok) {
      router.push("/admin/produtos");
      router.refresh();
    } else {
      setErro(res.erro ?? "Erro ao salvar.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-10">
      {erro && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-200">
          {erro}
        </div>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-6 text-lg font-semibold text-white">Plataformas disponíveis</h2>
        <p className="mb-4 text-sm text-zinc-400">Selecione para quais consoles este jogo está disponível:</p>
        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 transition-colors hover:border-zinc-600">
            <input
              type="checkbox"
              checked={disponivelPs4}
              onChange={(e) => setDisponivelPs4(e.target.checked)}
              className="h-5 w-5 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            <div className="flex items-center gap-2">
              <svg className="h-6 w-6 text-zinc-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.5 5.5v5.07L14.05 8l-4.55-2.5zm-1 11V13l-1.17.65v4.7l1.17.65zm1.17-4.35L14.05 15l-4.55-2.5v-1.17l4.55 2.5-4.55 2.5v3.15l6.9-3.85-6.9-3.85v1.17zm7.08.35l-1.5.84v4.16l1.5-.84v-4.16zm-7.08-4.35V6.98l6.9 3.85-6.9 3.85V12.5l4.55-2.5-4.55 2.5V11.15z"/>
              </svg>
              <span className="font-medium text-white">PlayStation 4</span>
            </div>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 transition-colors hover:border-zinc-600">
            <input
              type="checkbox"
              checked={disponivelPs5}
              onChange={(e) => setDisponivelPs5(e.target.checked)}
              className="h-5 w-5 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            <div className="flex items-center gap-2">
              <svg className="h-6 w-6 text-zinc-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.5 5.5v5.07L14.05 8l-4.55-2.5zm-1 11V13l-1.17.65v4.7l1.17.65zm1.17-4.35L14.05 15l-4.55-2.5v-1.17l4.55 2.5-4.55 2.5v3.15l6.9-3.85-6.9-3.85v1.17zm7.08.35l-1.5.84v4.16l1.5-.84v-4.16zm-7.08-4.35V6.98l6.9 3.85-6.9 3.85V12.5l4.55-2.5-4.55 2.5V11.15z"/>
              </svg>
              <span className="font-medium text-white">PlayStation 5</span>
            </div>
          </label>
        </div>
        {!disponivelPs4 && !disponivelPs5 && (
          <p className="mt-3 text-sm text-amber-400">⚠ Selecione pelo menos uma plataforma</p>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-6 text-lg font-semibold text-white">Informações gerais</h2>
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Nome do produto</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => {
                const v = e.target.value;
                setNome(v);
                if (!slug || slug === slugify(nome)) setSlug(slugify(v));
              }}
              required
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label htmlFor="descricaoProduto" className="mb-2 block text-sm font-medium text-zinc-300">
              Descrição (mesmo formato de Importar jogo — use • e ■ para títulos)
            </label>
            <textarea
              id="descricaoProduto"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={10}
              placeholder="Cole o texto da descrição como na PlayStation Store (com • e títulos em maiúsculas ou ■ Título de seção)..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex flex-wrap gap-8">
            <Switch label="Produto ativo" checked={ativo} onChange={setAtivo} />
            <Switch label="Em destaque" checked={emDestaque} onChange={setEmDestaque} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Capa do produto</h2>
        <div className="flex items-center gap-6">
          {/* Prévia da imagem */}
          <div 
            className="relative shrink-0 overflow-hidden rounded-xl bg-zinc-800 border-2 border-zinc-700"
            style={{ width: "140px", height: "175px" }}
          >
            {imagemUrl ? (
              <img
                src={imagemUrl}
                alt="Prévia da capa"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400";
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-500">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 text-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImage}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadImage(f);
                }}
              />
              {uploadingImage ? "Enviando…" : "Alterar imagem"}
            </label>
            <p className="text-xs text-zinc-500">Recomendado: 400×500 px</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-6 text-lg font-semibold text-white">Painel financeiro e estoque</h2>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-zinc-400">Financeiro</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Preço de venda base (R$)</label>
                {editandoPrecoBase ? (
                  <input
                    type="text"
                    inputMode="decimal"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    onBlur={() => setEditandoPrecoBase(false)}
                    autoFocus
                    placeholder="0,00"
                    className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500"
                  />
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onDoubleClick={() => setEditandoPrecoBase(true)}
                    onKeyDown={(e) => e.key === "Enter" && setEditandoPrecoBase(true)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-zinc-500 cursor-pointer hover:bg-zinc-800/80 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    title="Duplo clique para editar"
                  >
                    {preco ? Number(preco.replace(",", ".")).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                  </div>
                )}
                <p className="mt-1 text-xs text-zinc-500">Preço base quando não há promoção. Duplo clique para editar.</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="usarPromoPorConsole"
                  checked={usarPrecoPromocionalPorConsole}
                  onChange={(e) => setUsarPrecoPromocionalPorConsole(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="usarPromoPorConsole" className="text-sm font-medium text-zinc-300">
                  Usar preço promocional diferente por console
                </label>
              </div>
              {!usarPrecoPromocionalPorConsole ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Preço promocional (R$) – para os dois</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={precoPromocional}
                    onChange={(e) => setPrecoPromocional(e.target.value)}
                    placeholder="Opcional"
                    className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500"
                  />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">Preço promocional PS4 (R$)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={precoPromocionalPs4}
                      onChange={(e) => setPrecoPromocionalPs4(e.target.value)}
                      placeholder="Opcional"
                      className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">Preço promocional PS5 (R$)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={precoPromocionalPs5}
                      onChange={(e) => setPrecoPromocionalPs5(e.target.value)}
                      placeholder="Opcional"
                      className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500"
                    />
                  </div>
                  <p className="sm:col-span-2 text-xs text-zinc-500">Preencha só o(s) console(s) que terão promo. Onde não preencher, o cliente vê o preço base.</p>
                </div>
              )}
              {!usarPrecoPromocionalPorConsole ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Preço de custo (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={precoCusto}
                    onChange={(e) => setPrecoCusto(e.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500"
                  />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">Preço de custo PS4 (R$)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={precoCustoPs4}
                      onChange={(e) => setPrecoCustoPs4(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">Preço de custo PS5 (R$)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={precoCustoPs5}
                      onChange={(e) => setPrecoCustoPs5(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 sm:col-span-2">Cada console com seu próprio preço de custo.</p>
                </div>
              )}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Preço de custo base (R$)</label>
                {editandoCustoBase ? (
                  <input
                    type="text"
                    inputMode="decimal"
                    value={precoCustoBase}
                    onChange={(e) => setPrecoCustoBase(e.target.value)}
                    onBlur={() => setEditandoCustoBase(false)}
                    autoFocus
                    placeholder="0,00"
                    className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500"
                  />
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onDoubleClick={() => setEditandoCustoBase(true)}
                    onKeyDown={(e) => e.key === "Enter" && setEditandoCustoBase(true)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-zinc-500 cursor-pointer hover:bg-zinc-800/80 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    title="Referência quando não há oferta ativa. Duplo clique para editar."
                  >
                    {precoCustoBase ? Number(precoCustoBase.replace(",", ".")).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-zinc-400">Estoque</h3>
            <Switch label="Gerenciar estoque" checked={gerenciarEstoque} onChange={setGerenciarEstoque} />
            {gerenciarEstoque && (
              <>
                {(disponivelPs4 || disponivelPs5) ? (
                  <>
                    <p className="text-xs text-zinc-500">Cada console com sua própria quantidade em estoque.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {disponivelPs4 && (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-zinc-300">Quantidade estoque PS4</label>
                          <input
                            type="number"
                            min={0}
                            value={quantidadeEstoquePs4}
                            onChange={(e) => {
                              const v = e.target.value;
                              setQuantidadeEstoquePs4(v);
                              setQuantidadeEstoque(
                                disponivelPs5
                                  ? String((Number(v) || 0) + (Number(quantidadeEstoquePs5) || 0))
                                  : v
                              );
                            }}
                            className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white"
                          />
                        </div>
                      )}
                      {disponivelPs5 && (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-zinc-300">Quantidade estoque PS5</label>
                          <input
                            type="number"
                            min={0}
                            value={quantidadeEstoquePs5}
                            onChange={(e) => {
                              const v = e.target.value;
                              setQuantidadeEstoquePs5(v);
                              setQuantidadeEstoque(
                                disponivelPs4
                                  ? String((Number(quantidadeEstoquePs4) || 0) + (Number(v) || 0))
                                  : v
                              );
                            }}
                            className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-500">Total (soma)</label>
                      <input
                        type="text"
                        readOnly
                        value={(Number(quantidadeEstoquePs4) || 0) + (Number(quantidadeEstoquePs5) || 0)}
                        className="w-full max-w-xs rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-zinc-500 cursor-not-allowed"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">Quantidade em estoque</label>
                    <input
                      type="number"
                      min={0}
                      value={quantidadeEstoque}
                      onChange={(e) => setQuantidadeEstoque(e.target.value)}
                      className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white"
                    />
                  </div>
                )}
                <p className="text-xs text-zinc-500">Se chegar a 0, o produto fica Indisponível no site.</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-6 text-lg font-semibold text-white">Categorização e URL</h2>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Categorias e subcategorias (várias permitidas; &quot;Ofertas&quot; aparece em destaque na listagem)
          </label>
          <div className="max-h-64 space-y-4 overflow-y-auto rounded-lg border border-[var(--border)] bg-zinc-900/50 p-4">
            {categoriasPai.map((pai) => {
              const filhos = subcategorias.filter((s) => s.parent_id === pai.id);
              return (
                <div key={pai.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded py-1 hover:bg-zinc-800/50">
                    <input
                      type="checkbox"
                      checked={selectedCategoriaIds.has(pai.id)}
                      onChange={() => toggleCategoria(pai.id)}
                      className="rounded border-zinc-600 bg-zinc-800 text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span className="font-medium text-white">{pai.nome}</span>
                  </label>
                  {filhos.length > 0 && (
                    <div className="ml-6 mt-1 space-y-1">
                      {filhos.map((sub) => (
                        <label
                          key={sub.id}
                          className="flex cursor-pointer items-center gap-2 rounded py-0.5 hover:bg-zinc-800/50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategoriaIds.has(sub.id)}
                            onChange={() => toggleCategoria(sub.id)}
                            className="rounded border-zinc-600 bg-zinc-800 text-[var(--accent)] focus:ring-[var(--accent)]"
                          />
                          <span className="text-zinc-300">{sub.nome}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-zinc-300">URL (slug)</label>
          <div className="flex items-center gap-2 text-zinc-500">
            <span className="text-sm">dominio.com/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="nome-do-jogo"
              className="flex-1 rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500"
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">Deixe vazio para gerar automaticamente com base no nome.</p>
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Salvar alterações"}
        </button>
        <Link
          href="/admin/produtos"
          className="rounded-lg border border-[var(--border)] px-6 py-3 font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
