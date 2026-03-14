const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDateTimeBR(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return "";
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateBR(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return "";
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function calcularParcela(preco: number, taxa: number, parcelas: number = 12): number {
  const precoComTaxa = preco + (preco * taxa / 100);
  return precoComTaxa / parcelas;
}

export function calcularPercentualDesconto(precoOriginal: number, precoAtual: number): number {
  if (precoOriginal <= 0 || precoAtual >= precoOriginal) return 0;
  return Math.round(((precoOriginal - precoAtual) / precoOriginal) * 100);
}
