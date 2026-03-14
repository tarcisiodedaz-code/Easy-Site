import Image from "next/image";
import Link from "next/link";
import type { ProdutoLoja } from "@/lib/supabase";
import { getImagemAltaResolucao } from "@/lib/imagem-playstation";

type ProdutoCardProps = {
  produto: ProdutoLoja;
  taxaCartao?: number;
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
      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-300">
        PS5
      </span>
      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-300">
        PS4
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

function calcularParcela(preco: number, taxa: number, parcelas: number = 12): number {
  const precoComTaxa = preco + (preco * taxa / 100);
  return precoComTaxa / parcelas;
}

export function ProdutoCard({ produto, taxaCartao = 5 }: ProdutoCardProps) {
  const imagemUrl =
    getImagemAltaResolucao(produto.imagem_url) ||
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80";
  const indisponivel = isIndisponivel(produto);
  const emOferta = temOfertaValida(produto);
  const precoExibir = emOferta && produto.preco_promocional != null
    ? Number(produto.preco_promocional)
    : produto.preco;
  const precoOriginal = produto.preco_original ?? produto.preco;
  const precoDeNum = typeof precoOriginal === "number" ? precoOriginal : Number(precoOriginal) || 0;
  const precoExibirNum = typeof precoExibir === "number" ? precoExibir : Number(precoExibir) || 0;
  const percentualDesconto =
    precoDeNum > 0 && precoExibirNum < precoDeNum
      ? Math.round(((precoDeNum - precoExibirNum) / precoDeNum) * 100)
      : 0;
  const parcela = calcularParcela(precoExibirNum, taxaCartao);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950 transition-all duration-300 hover:border-zinc-700/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <Link href={`/produto/${(produto as { slug?: string | null }).slug ?? produto.id ?? produto.id_externo}`} className="flex flex-col flex-1">
        <div className="relative w-full overflow-hidden rounded-t-2xl bg-zinc-900" style={{ aspectRatio: "4/5" }}>
          <Image
            src={imagemUrl}
            alt={produto.nome}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
            unoptimized={imagemUrl.startsWith("http") && !imagemUrl.includes("supabase")}
          />
          {percentualDesconto > 0 && (
            <div className="absolute left-2 top-2 z-10">
              <span className="inline-flex rounded-md bg-red-600 px-2 py-1 text-xs font-bold text-white shadow-lg">
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
        <div className="flex flex-1 flex-col p-4">
          <PlatformIcons />
          {/* Título */}
          <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug text-white transition-colors group-hover:text-zinc-200">
            {produto.nome}
          </h3>
          
          {/* Preço Original (riscado) */}
          {precoDeNum > precoExibirNum && (
            <p className="mt-2 text-sm text-zinc-500 line-through">
              De {formatarPreco(precoDeNum)}
            </p>
          )}
          
          {/* Preço PIX (destaque verde) */}
          <p className="mt-1">
            <span className="text-xl font-bold text-emerald-400">
              {formatarPreco(precoExibirNum)}
            </span>
            <span className="ml-1 text-sm font-medium text-emerald-400">no PIX</span>
          </p>
          
          {/* Parcelamento */}
          <p className="mt-1 text-sm text-white/80">
            Ou 12x de {formatarPreco(parcela)} no cartão*
          </p>
        </div>
      </Link>
      <div className="p-4 pt-0">
        {indisponivel ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800/50 py-2.5 text-xs font-medium text-zinc-400">
            Indisponível
          </div>
        ) : (
          <Link
            href={`/produto/${(produto as { slug?: string | null }).slug ?? produto.id ?? produto.id_externo}`}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/40 hover:brightness-110"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            COMPRAR
          </Link>
        )}
      </div>
    </article>
  );
}

/** Card V2 para vitrines - redesenhado com hierarquia de preços */
export function ProdutoCardV2({ produto, taxaCartao = 5 }: ProdutoCardProps) {
  const imagemUrl =
    getImagemAltaResolucao(produto.imagem_url) ||
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80";
  const indisponivel = isIndisponivel(produto);
  const emOferta = temOfertaValida(produto);
  const precoExibir = emOferta && produto.preco_promocional != null
    ? Number(produto.preco_promocional)
    : produto.preco;
  const precoOriginal = produto.preco_original ?? produto.preco;
  const precoDeNum = typeof precoOriginal === "number" ? precoOriginal : Number(precoOriginal) || 0;
  const precoExibirNum = typeof precoExibir === "number" ? precoExibir : Number(precoExibir) || 0;
  const percentualDesconto =
    precoDeNum > 0 && precoExibirNum < precoDeNum
      ? Math.round(((precoDeNum - precoExibirNum) / precoDeNum) * 100)
      : 0;
  const slug = (produto as { slug?: string | null }).slug ?? produto.id ?? produto.id_externo;
  const parcela = calcularParcela(precoExibirNum, taxaCartao);

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950 transition-all duration-300 hover:border-zinc-700/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <Link href={`/produto/${slug}`} className="flex flex-1 flex-col">
        <div className="relative w-full overflow-hidden rounded-t-xl bg-zinc-900" style={{ aspectRatio: "4/5" }}>
          <Image
            src={imagemUrl}
            alt={produto.nome}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 18vw"
            unoptimized={imagemUrl.startsWith("http") && !imagemUrl.includes("supabase")}
          />
          {percentualDesconto > 0 && (
            <div className="absolute left-1.5 top-1.5 z-10">
              <span className="inline-flex rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg">
                -{percentualDesconto}%
              </span>
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
        <div className="flex flex-1 flex-col p-3">
          {/* Título */}
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-white transition-colors group-hover:text-zinc-200">
            {produto.nome}
          </h3>
          
          <div className="mt-2 flex flex-col gap-1">
            {/* Preço Original riscado */}
            {precoDeNum > precoExibirNum && (
              <p className="text-xs text-zinc-500 line-through">
                De {formatarPreco(precoDeNum)}
              </p>
            )}
            
            {/* Preço PIX */}
            <p>
              <span className="text-lg font-bold text-emerald-400">
                {formatarPreco(precoExibirNum)}
              </span>
              <span className="ml-1 text-xs font-medium text-emerald-400">no PIX</span>
            </p>
            
            {/* Parcelamento */}
            <p className="text-xs text-white/80">
              Ou 12x de {formatarPreco(parcela)} no cartão*
            </p>
          </div>
        </div>
      </Link>
      <div className="p-3 pt-0">
        {indisponivel ? (
          <div className="flex items-center justify-center rounded-lg border border-zinc-600 bg-zinc-800/50 py-1.5 text-[10px] text-zinc-400">
            Indisponível
          </div>
        ) : (
          <Link
            href={`/produto/${slug}`}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 py-2 text-[11px] font-semibold text-white shadow-md shadow-violet-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/40 hover:brightness-110"
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            COMPRAR
          </Link>
        )}
      </div>
    </article>
  );
}
