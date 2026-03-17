import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProdutoPorSlug, getProdutoPorId } from "@/lib/produtos";
import { getCategoriaIdsDoProduto, getProdutosRelacionados } from "@/lib/produtos-completo";
import { getImagemAltaResolucao } from "@/lib/imagem-playstation";
import { getLojaConfig } from "@/lib/loja-config";
import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProdutoCard } from "@/components/ProdutoCard";
import type { ProdutoLoja } from "@/lib/supabase";

const WHATSAPP_NUMERO = "5579999204322";

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

  const [categoriaIds, relacionados, informacoesAdicionaisConfig] = await Promise.all([
    getCategoriaIdsDoProduto(produto.id!),
    getCategoriaIdsDoProduto(produto.id!).then((ids) => getProdutosRelacionados(produto!.id!, ids, 4)),
    getLojaConfig("informacoes_adicionais"),
  ]);

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

  const precoFormatado = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(precoExibir);
  const whatsappMsg = `Olá! Gostaria de comprar: ${produto.nome} - ${precoFormatado}`;
  const indisponivel =
    produto.gerenciar_estoque === true && (produto.quantidade_estoque ?? 0) <= 0;
  const produtoComDescricao = produto as ProdutoLoja & { descricao?: string | null };
  const descricaoHtml = produtoComDescricao.descricao ?? "";
  const informacoesAdicionaisHtml =
    (informacoesAdicionaisConfig && typeof informacoesAdicionaisConfig === "object" && "html" in informacoesAdicionaisConfig
      ? (informacoesAdicionaisConfig as { html?: string }).html
      : null) ?? "";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StoreHeader />

      <main className="mx-auto max-w-7xl px-4 pt-[130px] pb-16 sm:px-6 sm:pt-[140px] md:pt-[150px] lg:px-8">
        <Link
          href="/categorias/ofertas"
          className="mb-6 inline-block text-sm text-zinc-400 transition-colors hover:text-white"
        >
          ← Voltar às ofertas
        </Link>

        {/* Área de destaque (topo): capa à esquerda, info à direita */}
        <section className="grid gap-8 md:grid-cols-[minmax(0,340px)_1fr] lg:gap-12">
          <div className="relative aspect-[3/4] max-h-[480px] w-full overflow-hidden rounded-xl bg-zinc-900 md:max-h-none">
            <Image
              src={imagemUrl}
              alt={produto.nome}
              width={340}
              height={453}
              className="h-full w-full object-cover"
              priority
              unoptimized={imagemUrl.startsWith("http") && !imagemUrl.includes("supabase")}
            />
            {temPromoValida && percentualDesconto > 0 && (
              <div className="absolute right-3 top-3 z-10">
                <span className="inline-flex rounded-lg px-3 py-1.5 text-sm font-bold shadow-lg bg-gradient-to-r from-[#6366f1] to-[#4ade80] text-white">
                  -{percentualDesconto}%
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[2.75rem]">
              {produto.nome}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded bg-zinc-700/80 px-2.5 py-1 text-xs font-medium text-zinc-200">
                PS5
              </span>
              <span className="rounded bg-zinc-700/80 px-2.5 py-1 text-xs font-medium text-zinc-200">
                PS4
              </span>
            </div>
            <div className="mt-6 space-y-1">
              <p className="text-3xl font-bold text-emerald-400 sm:text-4xl">{precoFormatado}</p>
              {precoRiscado != null && (
                <p className="text-lg text-zinc-500 line-through">
                  De{" "}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(precoRiscado)}
                </p>
              )}
              <p className="text-sm text-zinc-400">ou em até 12x</p>
              <p className="text-sm text-zinc-400">Pague com Pix</p>
            </div>
            <div className="mt-8 flex max-w-[320px] flex-col gap-2.5">
              {indisponivel ? (
                <div className="rounded-xl border border-amber-600/50 bg-amber-950/20 py-3 text-center text-sm text-amber-400">
                  Produto indisponível no momento (estoque esgotado).
                </div>
              ) : (
                <>
                  <Link
                    href="/login?redirect=/carrinho"
                    className="flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
                  >
                    Comprar
                  </Link>
                  <AddToCartButton
                    produto={{ ...produto, preco: precoExibir }}
                    className="w-full rounded-xl px-6 py-3 text-sm font-semibold"
                  >
                    Adicionar ao carrinho
                  </AddToCartButton>
                </>
              )}
              <a
                href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(whatsappMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--accent)] bg-transparent px-6 py-2.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
              >
                Comprar agora via WhatsApp
              </a>
            </div>
          </div>
        </section>

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
