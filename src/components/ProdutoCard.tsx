import Image from "next/image";
import Link from "next/link";
import type { ProdutoLoja } from "@/lib/supabase";
import { getImagemAltaResolucao } from "@/lib/imagem-playstation";
import { AddToCartButton } from "./AddToCartButton";

type ProdutoCardProps = {
  produto: ProdutoLoja;
};

function formatarPreco(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function PlatformIcons() {
  return (
    <div className="flex gap-1">
      <span className="rounded bg-zinc-800 px-1 py-0.5 text-[8px] font-medium text-zinc-400">
        PS4
      </span>
      <span className="rounded bg-zinc-800 px-1 py-0.5 text-[8px] font-medium text-zinc-400">
        PS5
      </span>
    </div>
  );
}

function isIndisponivel(produto: ProdutoLoja): boolean {
  return (
    produto.gerenciar_estoque === true &&
    (produto.quantidade_estoque ?? 0) <= 0
  );
}

/** Exibe tarja/desconto só se preco_promocional válido e dentro do período (início/fim) */
function temOfertaValida(produto: ProdutoLoja): boolean {
  const promo = produto.preco_promocional;
  if (promo == null || Number(promo) <= 0) return false;
  const now = Date.now();
  const inicio = produto.oferta_inicio ? new Date(produto.oferta_inicio).getTime() : null;
  const fim = produto.oferta_fim ? new Date(produto.oferta_fim).getTime() : null;
  if (inicio != null && now < inicio) return false;
  if (fim != null && now > fim) return false;
  return true;
}

export function ProdutoCard({ produto }: ProdutoCardProps) {
  const imagemUrl =
    getImagemAltaResolucao(produto.imagem_url) ||
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80";
  const indisponivel = isIndisponivel(produto);
  const emOferta = temOfertaValida(produto);
  const precoExibir = emOferta && produto.preco_promocional != null
    ? Number(produto.preco_promocional)
    : produto.preco;
  const precoRiscado = emOferta ? produto.preco : null;
  const precoDeNum = precoRiscado != null ? Number(precoRiscado) : 0;
  const precoExibirNum = typeof precoExibir === "number" ? precoExibir : Number(precoExibir) || 0;
  const percentualDesconto =
    emOferta && precoDeNum > 0 && precoExibirNum < precoDeNum
      ? Math.round(((precoDeNum - precoExibirNum) / precoDeNum) * 100)
      : 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950 transition-all duration-300 hover:border-zinc-700/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <Link href={`/produto/${(produto as { slug?: string | null }).slug ?? produto.id ?? produto.id_externo}`} className="flex flex-col flex-1">
        <div className="relative w-full overflow-hidden rounded-t-2xl bg-zinc-900" style={{ aspectRatio: "3/4" }}>
          <Image
            src={imagemUrl}
            alt={produto.nome}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
            unoptimized={imagemUrl.startsWith("http") && !imagemUrl.includes("supabase")}
          />
          {emOferta && percentualDesconto > 0 && (
            <div className="absolute right-2 top-2 z-10">
              <span className="inline-flex rounded-md px-2 py-1 text-xs font-bold shadow-lg bg-gradient-to-r from-[#6366f1] to-[#4ade80] text-white">
                -{percentualDesconto}%
              </span>
            </div>
          )}
          {indisponivel && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="rounded bg-amber-500/90 px-3 py-1.5 text-sm font-semibold text-white">
                Indisponível
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-2.5 text-left">
          <PlatformIcons />
          <h3 className="mt-1 line-clamp-2 text-sm leading-tight text-white transition-colors group-hover:text-zinc-200">
            {produto.nome}
          </h3>
          <div className="mt-2 flex flex-col gap-0.5">
            {precoRiscado != null && (
              <span className="text-xs text-zinc-500 line-through">
                {formatarPreco(precoRiscado)}
              </span>
            )}
            <span className="text-lg font-semibold tracking-tight text-emerald-400">
              {formatarPreco(precoExibir)}
            </span>
          </div>
        </div>
      </Link>
      <div className="p-2.5 pt-0">
        {indisponivel ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800/50 py-2 text-xs font-medium text-zinc-400">
            Indisponível
          </div>
        ) : (
          <AddToCartButton
            produto={
              emOferta && produto.preco_promocional != null
                ? { ...produto, preco: Number(produto.preco_promocional) }
                : produto
            }
            variant="gradient"
            className="py-2 text-xs"
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            COMPRAR
          </AddToCartButton>
        )}
      </div>
    </article>
  );
}

/** Ícone Pix (estilo simplificado) */
function PixIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Card V2 para vitrines (estilo PS Store): capa 3/4, título e preços compactos, 5 colunas no desktop */
export function ProdutoCardV2({ produto }: ProdutoCardProps) {
  const imagemUrl =
    getImagemAltaResolucao(produto.imagem_url) ||
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80";
  const indisponivel = isIndisponivel(produto);
  const emOferta = temOfertaValida(produto);
  const precoExibir = emOferta && produto.preco_promocional != null
    ? Number(produto.preco_promocional)
    : produto.preco;
  const precoDe = emOferta ? Number(produto.preco) : produto.preco_original ?? produto.preco;
  const precoDeNum = typeof precoDe === "number" ? precoDe : Number(precoDe) || 0;
  const precoExibirNum = typeof precoExibir === "number" ? precoExibir : Number(precoExibir) || 0;
  const percentualDesconto =
    emOferta && precoDeNum > 0 && precoExibirNum < precoDeNum
      ? Math.round(((precoDeNum - precoExibirNum) / precoDeNum) * 100)
      : 0;
  const slug = (produto as { slug?: string | null }).slug ?? produto.id ?? produto.id_externo;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950 transition-all duration-300 hover:border-zinc-700/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <Link href={`/produto/${slug}`} className="flex flex-1 flex-col">
        <div className="relative w-full overflow-hidden rounded-t-xl bg-zinc-900" style={{ aspectRatio: "3/4" }}>
          <Image
            src={imagemUrl}
            alt={produto.nome}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 18vw"
            unoptimized={imagemUrl.startsWith("http") && !imagemUrl.includes("supabase")}
          />
          {emOferta && percentualDesconto > 0 && (
            <div className="absolute left-1.5 top-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 shadow-lg">
              <span className="text-[10px] font-bold text-white">-{percentualDesconto}%</span>
            </div>
          )}
          {indisponivel && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="rounded bg-amber-500/90 px-2 py-1 text-xs font-semibold text-white">
                Indisponível
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-2 text-left">
          <h3 className="line-clamp-2 text-xs font-medium leading-tight text-white transition-colors group-hover:text-zinc-200">
            {produto.nome}
          </h3>
          <div className="mt-1.5 flex flex-col gap-0.5">
            <p className="text-[11px] leading-tight text-zinc-500">
              De {formatarPreco(precoDe)} por{" "}
              <span className="font-semibold text-white">{formatarPreco(precoExibir)}</span>
            </p>
            <p className="flex items-center gap-1 text-xs font-bold tracking-tight text-cyan-400">
              <PixIcon className="h-3 w-3" />
              PIX: {formatarPreco(precoExibir)}
            </p>
          </div>
        </div>
      </Link>
      <div className="p-2 pt-0">
        {indisponivel ? (
          <div className="flex items-center justify-center rounded-lg border border-zinc-600 bg-zinc-800/50 py-1.5 text-[11px] text-zinc-400">
            Indisponível
          </div>
        ) : (
          <AddToCartButton
            produto={
              emOferta && produto.preco_promocional != null
                ? { ...produto, preco: Number(produto.preco_promocional) }
                : produto
            }
            variant="gradient"
            className="w-full rounded-lg py-2 text-[11px]"
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            COMPRAR
          </AddToCartButton>
        )}
      </div>
    </article>
  );
}
