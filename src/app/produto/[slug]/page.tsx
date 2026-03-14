import Link from "next/link";
import { notFound } from "next/navigation";
import { getProdutoPorSlug, getProdutoPorId } from "@/lib/produtos";
import { getCategoriaIdsDoProduto, getProdutosRelacionados, getCategoriasProdutoParaMenu } from "@/lib/produtos-completo";
import { getImagemAltaResolucao } from "@/lib/imagem-playstation";
import { getLojaConfig } from "@/lib/loja-config";
import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";
import { ProdutoCard } from "@/components/ProdutoCard";
import { ProdutoPageClient } from "./ProdutoPageClient";
import type { ProdutoLoja } from "@/lib/supabase";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const produto = await getProdutoPorSlug(slug) ?? await getProdutoPorId(slug);
  if (!produto) return { title: "Produto | Easy Games" };
  return {
    title: `${produto.nome} | Easy Games`,
    description: produto.nome,
  };
}

export default async function ProdutoSlugPage({ params }: Props) {
  const { slug } = await params;
  let produto = await getProdutoPorSlug(slug);
  if (!produto) produto = await getProdutoPorId(slug);
  if (!produto) notFound();

  const [categoriaIds, relacionados, informacoesAdicionaisConfig, mercadoPagoConfig, iconeMercadoPago, iconePix, iconePS4, iconePS5, logoMarca, categoriasMenu] = await Promise.all([
    getCategoriaIdsDoProduto(produto.id!),
    getCategoriaIdsDoProduto(produto.id!).then((ids) => getProdutosRelacionados(produto!.id!, ids, 4)),
    getLojaConfig("informacoes_adicionais"),
    getLojaConfig("mercado_pago"),
    getLojaConfig("icone_mercado_pago"),
    getLojaConfig("icone_pix"),
    getLojaConfig("icone_ps4"),
    getLojaConfig("icone_ps5"),
    getLojaConfig("logo_marca"),
    getCategoriasProdutoParaMenu(),
  ]);

  const taxaCartao = mercadoPagoConfig?.taxaCartao ?? 5;

  const imagemUrl =
    getImagemAltaResolucao(produto.imagem_url) ||
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80";

  const promo = produto.preco_promocional;
  const temPromoValida =
    promo != null &&
    Number(promo) > 0 &&
    (produto.oferta_inicio ? new Date(produto.oferta_inicio).getTime() <= Date.now() : true) &&
    (produto.oferta_fim ? new Date(produto.oferta_fim).getTime() >= Date.now() : true);
  const precoExibir = temPromoValida && promo != null ? Number(promo) : produto.preco;
  const precoRiscado = temPromoValida ? produto.preco : null;
  const percentualDesconto =
    temPromoValida && Number(produto.preco) > 0 && promo != null && Number(promo) > 0
      ? Math.round(((Number(produto.preco) - Number(promo)) / Number(produto.preco)) * 100)
      : 0;

  const produtoComDescricao = produto as ProdutoLoja & { descricao?: string | null };
  const descricaoHtml = produtoComDescricao.descricao ?? "";
  const informacoesAdicionaisHtml =
    (informacoesAdicionaisConfig && typeof informacoesAdicionaisConfig === "object" && "html" in informacoesAdicionaisConfig
      ? (informacoesAdicionaisConfig as { html?: string }).html
      : null) ?? "";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StoreHeader logoUrl={logoMarca?.url ?? null} categoriasMenu={categoriasMenu} />

      <main className="mx-auto max-w-7xl px-4 pt-[130px] pb-16 sm:px-6 sm:pt-[140px] md:pt-[150px] lg:px-8">
        <Link
          href="/categorias/ofertas"
          className="mb-6 inline-block text-sm text-zinc-400 transition-colors hover:text-white"
        >
          ← Voltar às ofertas
        </Link>

        {/* Área de destaque com seletor de versão */}
        <ProdutoPageClient
          produto={produto as ProdutoLoja & { descricao?: string | null }}
          precoExibir={precoExibir}
          precoRiscado={precoRiscado}
          percentualDesconto={percentualDesconto}
          imagemUrl={imagemUrl}
          informacoesAdicionaisHtml={informacoesAdicionaisHtml}
          descricaoHtml={descricaoHtml}
          taxaCartaoInicial={taxaCartao}
          iconeMercadoPagoInicial={iconeMercadoPago?.url ?? null}
          iconePixInicial={iconePix?.url ?? null}
          iconePS4Inicial={iconePS4?.url ?? null}
          iconePS5Inicial={iconePS5?.url ?? null}
        />

        {/* Área de conteúdo: largura total, abaixo da capa */}
        <div className="mx-auto mt-16 w-full max-w-4xl">
          {descricaoHtml && (
            <div className="border-t border-zinc-800 pt-10">
              <h2 className="mb-6 text-xl font-bold text-white">Descrição</h2>
              <div className="rounded-xl border border-zinc-700/80 bg-zinc-800/60 p-6">
                <div
                  className="descricao-ps text-zinc-300 leading-relaxed [&_a]:text-[var(--accent)] [&_ul]:list-disc [&_.text-white]:text-white [&_strong]:font-semibold [&_p]:leading-relaxed [&_ul]:space-y-1 [&_li]:ml-4 [&_p]:mb-4"
                  dangerouslySetInnerHTML={{ __html: descricaoHtml }}
                />
              </div>
            </div>
          )}

          <div className="border-t border-zinc-800 pt-10">
            <h2 className="mb-6 text-xl font-bold text-white">Informações adicionais</h2>
            {informacoesAdicionaisHtml ? (
              <div className="rounded-xl border border-zinc-700/80 bg-zinc-800/60 p-6">
                <div
                  className="descricao-ps text-zinc-300 leading-relaxed [&_a]:text-[var(--accent)] [&_ul]:list-disc [&_.text-white]:text-white [&_strong]:font-semibold [&_p]:leading-relaxed [&_ul]:space-y-1 [&_li]:ml-4 [&_p]:mb-4"
                  dangerouslySetInnerHTML={{ __html: informacoesAdicionaisHtml }}
                />
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Nenhum conteúdo configurado. Para exibir informações aqui, edite em <strong>Admin → Personalize sua Loja</strong> → seção &quot;Informações adicionais&quot;.
              </p>
            )}
          </div>
        </div>

        {relacionados.length > 0 && (
          <section className="mt-16 border-t border-zinc-800 pt-12">
            <h2 className="mb-6 text-xl font-bold text-white">Quem viu este também gostou</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {relacionados.map((p) => (
                <ProdutoCard key={p.id ?? p.id_externo} produto={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <StoreFooter />
    </div>
  );
}
