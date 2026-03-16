/**
 * Lógica de preço efetivo: base vs promocional (único ou por console).
 * - preco = sempre base para PS4 e PS5.
 * - Se usar_preco_promocional_por_console: usa preco_promocional_ps4 / preco_promocional_ps5 quando preenchidos.
 * - Senão: usa preco_promocional (único) quando preenchido e dentro do período.
 */

type ProdutoPreco = {
  preco: number;
  preco_promocional?: number | null;
  preco_promocional_ps4?: number | null;
  preco_promocional_ps5?: number | null;
  usar_preco_promocional_por_console?: boolean;
  oferta_inicio?: string | null;
  oferta_fim?: string | null;
};

function temPromoValidaNoPeriodo(p: ProdutoPreco, usarPromo: number | null): boolean {
  if (usarPromo == null || Number(usarPromo) <= 0) return false;
  const now = Date.now();
  const inicio = p.oferta_inicio ? new Date(p.oferta_inicio).getTime() : null;
  const fim = p.oferta_fim ? new Date(p.oferta_fim).getTime() : null;
  if (inicio != null && now < inicio) return false;
  if (fim != null && now > fim) return false;
  return true;
}

/** Preço efetivo para um console (base ou promocional conforme regras). */
export function precoEfetivoParaConsole(
  p: ProdutoPreco,
  console: "ps4" | "ps5"
): number {
  const base = Number(p.preco) || 0;

  if (p.usar_preco_promocional_por_console) {
    const promoConsole = console === "ps4" ? p.preco_promocional_ps4 : p.preco_promocional_ps5;
    if (temPromoValidaNoPeriodo(p, promoConsole ?? null) && promoConsole != null && Number(promoConsole) > 0) {
      return Number(promoConsole);
    }
    return base;
  }

  const promo = p.preco_promocional;
  if (temPromoValidaNoPeriodo(p, promo ?? null) && promo != null && Number(promo) > 0) {
    return Number(promo);
  }
  return base;
}

/** Menor preço efetivo entre os consoles disponíveis (para card na home). */
export function menorPrecoEfetivo(
  p: ProdutoPreco & { disponivel_ps4?: boolean; disponivel_ps5?: boolean }
): number {
  const dispPs4 = p.disponivel_ps4 !== false;
  const dispPs5 = p.disponivel_ps5 !== false;
  const precos: number[] = [];
  if (dispPs4) precos.push(precoEfetivoParaConsole(p, "ps4"));
  if (dispPs5) precos.push(precoEfetivoParaConsole(p, "ps5"));
  if (precos.length === 0) return Number(p.preco) || 0;
  return Math.min(...precos);
}

/** Preço “riscado” (base) quando há promo ativa para aquele console. */
export function precoRiscadoParaConsole(
  p: ProdutoPreco,
  console: "ps4" | "ps5"
): number | null {
  const base = Number(p.preco) || 0;
  if (p.usar_preco_promocional_por_console) {
    const promoConsole = console === "ps4" ? p.preco_promocional_ps4 : p.preco_promocional_ps5;
    if (temPromoValidaNoPeriodo(p, promoConsole ?? null) && promoConsole != null && Number(promoConsole) > 0 && Number(promoConsole) < base) {
      return base;
    }
    return null;
  }
  const promo = p.preco_promocional;
  if (temPromoValidaNoPeriodo(p, promo ?? null) && promo != null && Number(promo) > 0 && Number(promo) < base) {
    return base;
  }
  return null;
}
