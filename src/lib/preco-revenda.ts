/**
 * Calcula o preço de custo a partir do preço da PlayStation Store.
 * Regra: custo = metade do preço em verde (preço Sony).
 */
export function calcularPrecoCusto(precoSony: number): number {
  const custo = precoSony / 2;
  return Math.round(custo * 100) / 100;
}

/**
 * Calcula o preço promocional da loja a partir do preço de custo,
 * seguindo as faixas definidas:
 *
 * - 15,00 até 44,99  → custo + 10,00
 * - 45,00 até 74,99 → custo + 15,00
 * - 75,00 até 124,99 → custo + 20,00
 * - acima de 125,00  → custo + 25,00
 *
 * Para custos abaixo de 15,00, aplica custo + 10,00 por padrão.
 */
export function calcularPrecoPromocionalAPartirDoCusto(precoCusto: number): number {
  let acrescimo: number;

  if (precoCusto >= 15 && precoCusto <= 44.99) {
    acrescimo = 10;
  } else if (precoCusto >= 45 && precoCusto <= 74.99) {
    acrescimo = 15;
  } else if (precoCusto >= 75 && precoCusto <= 124.99) {
    acrescimo = 20;
  } else if (precoCusto >= 125) {
    acrescimo = 25;
  } else {
    // Faixa não especificada (abaixo de 15) — usa +10,00 como padrão.
    acrescimo = 10;
  }

  let promo = precoCusto + acrescimo;
  promo = Math.round(promo * 100) / 100;

  // Arredondamento psicológico geral para a faixa 0–500:
  // - para qualquer valor entre 0 e 500,
  //   arredonda para (múltiplo de 5 mais próximo) - 0,10.
  //   Ex.: 100,00–102,49 → 99,90; 102,50–107,49 → 104,90; 107,50–112,49 → 109,90.
  if (promo > 0 && promo <= 500) {
    const multiploMaisProximo = Math.round(promo / 5) * 5; // 100, 105, 110, ...
    const arredondado = Math.max(0, multiploMaisProximo - 0.1);
    return Math.round(arredondado * 100) / 100;
  }

  return promo;
}
