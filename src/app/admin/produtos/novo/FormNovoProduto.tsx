"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RichTextEditor } from "@/components/RichTextEditor";
import { cadastrarProduto } from "./actions";
import { slugify } from "@/lib/produtos-completo";
import type { CategoriaProduto } from "@/lib/produtos-completo";

type Props = { categorias: CategoriaProduto[] };

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

export function FormNovoProduto({ categorias }: Props) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [visivelSite, setVisivelSite] = useState(true);
  const [emDestaque, setEmDestaque] = useState(false);
  const [precoCusto, setPrecoCusto] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");
  const [precoPromocional, setPrecoPromocional] = useState("");
  const [gerenciarEstoque, setGerenciarEstoque] = useState(false);
  const [quantidadeEstoque, setQuantidadeEstoque] = useState("0");
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemUrl, setImagemUrl] = useState("");
  const [linkVideo, setLinkVideo] = useState("");
  const [slug, setSlug] = useState("");
  const [selectedCategoriaIds, setSelectedCategoriaIds] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const subcategorias = categorias.filter((c) => c.parent_id);
  const categoriasPai = categorias.filter((c) => !c.parent_id);

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


  return (
    <form
      action={async (fd) => {
        setSalvando(true);
        setErro(null);
        const res = await cadastrarProduto(fd);
        setSalvando(false);
        if (res.ok) {
          router.push("/admin/produtos");
          router.refresh();
        } else {
          setErro(res.erro ?? "Erro ao cadastrar.");
        }
      }}
      className="mt-8 space-y-10"
    >
      <input type="hidden" name="nome" value={nome} />
      <input type="hidden" name="descricao" value={descricao} />
      <input type="hidden" name="ativo" value={String(ativo)} />
      <input type="hidden" name="visivel_site" value={String(visivelSite)} />
      <input type="hidden" name="em_destaque" value={String(emDestaque)} />
      <input type="hidden" name="preco_custo" value={precoCusto} />
      <input type="hidden" name="preco" value={precoVenda} />
      <input type="hidden" name="preco_promocional" value={precoPromocional} />
      <input type="hidden" name="preco_original" value={precoVenda} />
      <input type="hidden" name="gerenciar_estoque" value={String(gerenciarEstoque)} />
      <input type="hidden" name="quantidade_estoque" value={quantidadeEstoque} />
      <input type="hidden" name="link_video" value={linkVideo} />
      <input type="hidden" name="slug" value={slug} />
      {Array.from(selectedCategoriaIds).map((id) => (
        <input key={id} type="hidden" name="categoria_ids" value={id} />
      ))}
      <input type="hidden" name="imagem_url" value={imagemUrl} />

      {erro && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-200">
          {erro}
        </div>
      )}

      {/* Informações gerais */}
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
                setSlug((s) => (s === "" || s === slugify(nome) ? slugify(v) : s));
              }}
              required
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Descrição</label>
            <RichTextEditor value={descricao} onChange={setDescricao} minHeight="220px" />
          </div>
          <div className="flex flex-wrap gap-8">
            <Switch label="Produto ativo" checked={ativo} onChange={setAtivo} />
            <Switch label="Visível no site" checked={visivelSite} onChange={setVisivelSite} />
            <Switch label="Em destaque" checked={emDestaque} onChange={setEmDestaque} />
          </div>
        </div>
      </section>

      {/* Gestão financeira e estoque */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-6 text-lg font-semibold text-white">Gestão financeira e estoque</h2>
        <div className="grid gap-6 sm:grid-cols-3">
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
            <label className="mb-2 block text-sm font-medium text-zinc-300">Preço de venda (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={precoVenda}
              onChange={(e) => setPrecoVenda(e.target.value)}
              required
              placeholder="0,00"
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
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
        <div className="mt-6 flex flex-col gap-4">
          <Switch label="Gerenciar estoque" checked={gerenciarEstoque} onChange={setGerenciarEstoque} />
          {gerenciarEstoque && (
            <div className="max-w-xs">
              <label className="mb-2 block text-sm font-medium text-zinc-300">Quantidade em estoque</label>
              <input
                type="number"
                min={0}
                value={quantidadeEstoque}
                onChange={(e) => setQuantidadeEstoque(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white"
              />
            </div>
          )}
        </div>
      </section>

      {/* Mídia e categorização */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-6 text-lg font-semibold text-white">Mídia e categorização</h2>
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Imagem do produto</label>
            <p className="mb-2 text-xs text-amber-400/90">
              Dimensão recomendada: 300×400 px (proporção 3:4) — padronização estilo PS Store.
            </p>
            <div className="flex flex-wrap gap-4">
              <label className="cursor-pointer rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700">
                <input
                  type="file"
                  name="imagem_file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImagemFile(e.target.files?.[0] ?? null)}
                />
                {imagemFile ? imagemFile.name : "Enviar imagem (Supabase Storage)"}
              </label>
              <span className="text-sm text-zinc-500">ou</span>
              <input
                type="url"
                value={imagemUrl}
                onChange={(e) => setImagemUrl(e.target.value)}
                placeholder="URL da imagem"
                className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Link do vídeo (YouTube / Vimeo)</label>
            <input
              type="url"
              value={linkVideo}
              onChange={(e) => setLinkVideo(e.target.value)}
              placeholder="https://www.youtube.com/..."
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500"
            />
          </div>
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
        </div>
      </section>

      {/* SEO e URL */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-6 text-lg font-semibold text-white">SEO e URL amigável</h2>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">URL do produto (slug)</label>
          <div className="flex items-center gap-2 text-zinc-500">
            <span className="text-sm">dominio.com.br/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              onBlur={() => {
                if (!slug && nome) setSlug(slugify(nome));
              }}
              placeholder="nome-do-jogo"
              className="flex-1 rounded-lg border border-[var(--border)] bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">Deixe vazio para gerar automaticamente com base no nome.</p>
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {salvando ? "Cadastrando…" : "Cadastrar"}
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
