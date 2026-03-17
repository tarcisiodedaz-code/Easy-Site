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
  gerenciar_estoque?: boolean;
  quantidade_estoque?: number;
  slug?: string | null;
  categoria_id?: string | null;
  subcategoria_id?: string | null;
  oferta_inicio?: string | null;
  oferta_fim?: string | null;
  is_lancamento?: boolean;
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
  const [preco, setPreco] = useState(String(produto.preco));
  const [precoPromocional, setPrecoPromocional] = useState(
    produto.preco_promocional != null ? String(produto.preco_promocional) : ""
  );
  const [gerenciarEstoque, setGerenciarEstoque] = useState(produto.gerenciar_estoque === true);
  const [quantidadeEstoque, setQuantidadeEstoque] = useState(
    String(produto.quantidade_estoque ?? 0)
  );
  const [slug, setSlug] = useState(produto.slug ?? "");
  const [selectedCategoriaIds, setSelectedCategoriaIds] = useState<Set<string>>(
    () => new Set(categoriaIdsIniciais)
  );
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
      preco_promocional: precoPromocional ? Number(precoPromocional.replace(",", ".")) : null,
      descricao: descricao || null,
      ativo,
      em_destaque: emDestaque,
      gerenciar_estoque: gerenciarEstoque,
      quantidade_estoque: Number(quantidadeEstoque) || 0,
      slug: slug || null,
      categoria_ids: Array.from(selectedCategoriaIds),
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
        <h2 className="mb-6 text-lg font-semibold text-white">Capa do produto</h2>
        <p className="mb-3 text-xs text-amber-400/90">
          Dimensão recomendada: 300×400 px (proporção 3:4) — padronização estilo PS Store.
        </p>
        <div className="flex flex-wrap items-start gap-4">
          <label className="cursor-pointer rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700">
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
            {uploadingImage ? "Enviando…" : "Substituir por nova imagem"}
          </label>
          <input
            type="url"
            value={imagemUrl}
            onChange={(e) => setImagemUrl(e.target.value)}
            placeholder="URL da imagem"
            className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500"
          />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-6 text-lg font-semibold text-white">Painel financeiro e estoque</h2>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-zinc-400">Financeiro</h3>
            <div className="grid gap-4 sm:grid-cols-2">
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
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Preço de custo anterior (R$)</label>
                <input
                  type="text"
                  readOnly
                  value={
                    produto.preco_custo_anterior != null
                      ? Number(produto.preco_custo_anterior).toFixed(2).replace(".", ",")
                      : "—"
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-zinc-500 cursor-not-allowed"
                  title="Apenas leitura — histórico do último custo antes da importação"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Preço de venda (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  required
                  placeholder="0,00"
                  className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Preço promocional (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={precoPromocional}
                  onChange={(e) => setPrecoPromocional(e.target.value)}
                  placeholder="Opcional"
                  className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500"
                />
              </div>
            </div>
            {/* Campos de início/fim de oferta foram removidos.
                Agora basta definir um preço promocional; a lógica de exibição usa
                esse valor em conjunto com a promoção atual (importação de ofertas). */}
          </div>
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-zinc-400">Estoque</h3>
            <Switch label="Gerenciar estoque" checked={gerenciarEstoque} onChange={setGerenciarEstoque} />
            {gerenciarEstoque && (
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Quantidade em estoque</label>
                <input
                  type="number"
                  min={0}
                  value={quantidadeEstoque}
                  onChange={(e) => setQuantidadeEstoque(e.target.value)}
                  className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white"
                />
                <p className="mt-1 text-xs text-zinc-500">Se chegar a 0, o produto fica Indisponível no site.</p>
              </div>
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
