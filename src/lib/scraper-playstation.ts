/**
 * Scraper para a página de ofertas da PlayStation Store (pt-BR).
 * A página pode retornar 403 em alguns ambientes; use headers de navegador.
 */

import * as cheerio from "cheerio";

/** URL da categoria "Todas as ofertas" — paginação é só o número no final: /1, /2, … /186 */
const DEALS_URL = "https://store.playstation.com/pt-br/category/3f772501-f6f8-49b7-abac-874a88ca4897/1";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
} as const;

export type OfertaScraped = {
  id_externo: string;
  nome: string;
  imagem_url: string;
  /** Preço com desconto (verde) na PS Store */
  preco_sony_verde: number;
  /** Preço cheio (vermelho) na PS Store; pode ser null se não houver desconto visível */
  preco_sony_vermelho: number | null;
};

/**
 * Converte texto de preço "R$ 49,90" ou "49,90" para número.
 */
function parsePreco(texto: string): number {
  if (!texto || !texto.trim()) return 0;
  const limpo = texto.replace(/\s/g, "").replace(/R\$\s*/i, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(limpo);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Tenta extrair o preço principal da página de produto a partir do HTML (ex.: "R$ 299,90").
 * Útil quando o __NEXT_DATA__ não traz o preço no formato esperado.
 */
function extrairPrecoDoHtml(html: string): number {
  const padraoReal =
    /R\$\s*[\d.]{1,3}(?:\.\d{3})*,\d{2}|R\$\s*\d+[,.]\d{2}|\b(\d{2,4}[,.]\d{2})\s*(?:R\$|BRL|reais)/gi;
  const m = padraoReal.exec(html);
  if (m) {
    const str = (m[1] ?? m[0]).trim();
    const num = parsePreco(str.replace(/\s/g, ""));
    if (num >= 1) return num;
  }
  const jsonPrice = html.match(/"price"\s*:\s*"?(\d+(?:[.,]\d+)?)"?/);
  if (jsonPrice) {
    const num = parseFloat(jsonPrice[1].replace(",", "."));
    if (Number.isFinite(num) && num >= 1) return num;
  }
  return 0;
}

const LARGURA_ALTA_SCRAPER = 1200;

/**
 * Melhora a URL da imagem para maior resolução ao importar.
 * gmedia.playstation.com usa Adobe Image Serving: ?wid= define a largura (em pixels).
 */
function melhorarUrlImagem(url: string): string {
  if (!url || !url.startsWith("http")) return url;
  try {
    const u = new URL(url);
    if (u.hostname.includes("gmedia.playstation.com")) {
      u.searchParams.set("wid", String(LARGURA_ALTA_SCRAPER));
      return u.toString();
    }
    if (u.hostname.includes("playstation.com") && u.searchParams.has("wid")) {
      u.searchParams.set("wid", String(LARGURA_ALTA_SCRAPER));
      return u.toString();
    }
    const s = u.toString();
    if (u.hostname.includes("apollo2.dl.playstation.net") && /\/(\d{2,3})x(\d{2,3})\//.test(s)) {
      return s.replace(/\/(\d{2,3})x(\d{2,3})\//, `/${LARGURA_ALTA_SCRAPER}x${LARGURA_ALTA_SCRAPER}/`);
    }
    if (s.includes("/thumb/") || s.includes("/small/")) {
      return s.replace(/\/thumb\//i, "/large/").replace(/\/small\//i, "/large/");
    }
  } catch {
    // ignore
  }
  return url;
}

/**
 * Extrai ID único do produto (slug da URL ou fallback).
 */
function extrairId(href: string, nome: string, index: number): string {
  const match = href.match(/\/product\/([^/?]+)/i) || href.match(/\/([a-z0-9_-]+)\/?$/i);
  if (match) return match[1];
  const slug = nome
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `prod-${index}`;
}

/**
 * Tenta extrair ofertas de um JSON embutido no HTML (ex: __NEXT_DATA__, __PRELOADED_STATE__).
 */
function extrairDeJsonEmbutido(html: string): OfertaScraped[] | null {
  const nextData = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
  if (nextData) {
    try {
      const data = JSON.parse(nextData[1]);
      const props = data?.props?.pageProps ?? data?.props ?? data;
      const products = props?.data?.products ?? props?.products ?? props?.deals ?? [];
      if (Array.isArray(products) && products.length > 0) {
        return products
          .filter((p: { price?: unknown; discountedPrice?: unknown; name?: string }) => (p.price != null || p.discountedPrice != null) && p.name)
          .map((p: Record<string, unknown>, i: number) => {
            const name = String(p.name ?? p.title ?? "");
            const price = Number(p.discountedPrice ?? p.discountPrice ?? p.price ?? p.finalPrice ?? 0);
            const image = String(p.image ?? p.imageUrl ?? p.thumbnail ?? "").trim() || "";
            const id = String(p.id ?? p.productId ?? p.sku ?? extrairId(String(p.url ?? ""), name, i));
            return {
              id_externo: id,
              nome: name,
              imagem_url: melhorarUrlImagem(image || ""),
              preco_sony_verde: price,
              preco_sony_vermelho: null,
            };
          })
          .filter((o: OfertaScraped) => o.preco_sony_verde > 0 && o.nome);
      }
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Extrai ofertas do HTML com Cheerio (selectors genéricos para cards de produto).
 */
function extrairDeHtml($: cheerio.CheerioAPI): OfertaScraped[] {
  const ofertas: OfertaScraped[] = [];
  const seen = new Set<string>();

  // Possíveis containers: product card, tile, cell
  const cards =
    $('[data-qa="product-card"], [data-qa="game-tile"], .product-card, .psw-product-tile, a[href*="/product/"]').toArray();

  cards.forEach((el, index) => {
    const $el = $(el);
    const link = $el.attr("href") || $el.find("a[href*='/product/']").attr("href") || "";
    const nome =
      $el.find("[data-qa='product-name'], .product-name, .psw-t-body, h3, [data-qa='product-title']").first().text().trim() ||
      $el.attr("aria-label") ||
      "";
    const img =
      $el.find("img").first().attr("src") ||
      $el.find("img").first().attr("data-src") ||
      "";
    const precoText =
      $el.find("[data-qa='product-price'], .price, .psw-price, [data-qa='product-discount-price']").first().text().trim() ||
      $el.find("[data-qa='product-price-final']").text().trim() ||
      "";
    const preco = parsePreco(precoText);
    if (!nome || preco <= 0) return;
    const id = extrairId(link, nome, index);
    if (seen.has(id)) return;
    seen.add(id);
    const imgAbs = img.startsWith("http") ? img : img ? new URL(img, DEALS_URL).href : "";
    ofertas.push({
      id_externo: id,
      nome,
      imagem_url: melhorarUrlImagem(imgAbs),
      preco_sony_verde: preco,
      preco_sony_vermelho: null,
    });
  });

  return ofertas;
}

/**
 * Monta a URL de uma página específica (paginação).
 * Ex.: base ".../deals" → página 1 = ".../deals/1", página 2 = ".../deals/2"
 * Ou base ".../category/uuid/5" → base vira ".../category/uuid", depois .../1, .../2
 */
function urlParaPagina(baseUrl: string, pagina: number): string {
  const base = baseUrl.replace(/\/\d+\/?$/, "").replace(/\/?$/, "");
  if (pagina <= 1) return `${base}/1`;
  return `${base}/${pagina}`;
}

/**
 * Busca ofertas em uma única página.
 */
async function buscarUmaPagina(
  url: string
): Promise<{ ok: boolean; ofertas: OfertaScraped[]; erro?: string }> {
  const res = await fetch(url, {
    headers: HEADERS,
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return {
      ok: false,
      ofertas: [],
      erro: `Página retornou ${res.status}. A PlayStation Store pode bloquear requisições do servidor.`,
    };
  }

  const html = await res.text();
  let ofertas = extrairDeJsonEmbutido(html);

  if (!ofertas || ofertas.length === 0) {
    const $ = cheerio.load(html);
    ofertas = extrairDeHtml($);
  }

  return { ok: true, ofertas: ofertas ?? [] };
}

export type JogoScraped = {
  id_externo: string;
  nome: string;
  imagem_url: string;
  preco_original: number;
  descricao_raw: string | null;
};

/**
 * Extrai dados de um único produto a partir do __NEXT_DATA__ da página de produto.
 */
function extrairJogoDeJsonEmbutido(html: string, productUrl: string): JogoScraped | null {
  const nextData = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
  if (!nextData) return null;
  try {
    const data = JSON.parse(nextData[1]);
    const props = data?.props?.pageProps ?? data?.props ?? {};
    const product = props?.product ?? props?.data?.product ?? props?.data ?? props?.initialProduct ?? null;
    if (!product || typeof product !== "object") return null;

    const nome = String(product.name ?? product.title ?? product.displayName ?? "").trim();
    let preco =
      Number(product.discountedPrice ?? product.discountPrice ?? product.finalPrice ?? 0) ||
      Number(product.default_sku?.price ?? product.skus?.[0]?.price ?? 0);
    if (preco <= 0 && product.price != null) {
      const p = product.price;
      if (typeof p === "number") preco = p;
      else if (p && typeof p === "object" && "value" in p) {
        const v = Number((p as { value?: number }).value);
        if (Number.isFinite(v)) preco = v > 1000 ? v / 100 : v;
      }
    }
    if (preco <= 0 && product.default_sku?.price != null) {
      const p = product.default_sku.price;
      if (typeof p === "number") preco = p;
      else if (p && typeof p === "object" && "value" in p) {
        const v = Number((p as { value?: number }).value);
        if (Number.isFinite(v)) preco = v > 1000 ? v / 100 : v;
      }
    }
    const imagem =
      String(
        product.media?.images?.[0]?.url ??
          product.image ?? product.thumbnail ?? product.tileImage ?? product.heroImage ?? ""
      ).trim() || "";
    const descricao_raw =
      String(
        product.longDescription ?? product.description ?? product.detailedDescription ?? ""
      ).trim() || null;

    const idExterno =
      product.id ?? product.productId ?? product.sku ?? extrairId(productUrl, nome, 0);
    if (!nome) return null;

    return {
      id_externo: String(idExterno),
      nome,
      imagem_url: melhorarUrlImagem(imagem),
      preco_original: preco,
      descricao_raw: descricao_raw || null,
    };
  } catch {
    return null;
  }
}

/**
 * Extrai jogo do HTML da página de produto (fallback: meta og, título, preço em texto).
 */
function extrairJogoDeHtml($: cheerio.CheerioAPI, productUrl: string): JogoScraped | null {
  const nome =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("h1").first().text().trim() ||
    "";
  const imagem =
    $('meta[property="og:image"]').attr("content")?.trim() ||
    $("img[data-qa='product-image'], .product-hero img").first().attr("src") ||
    "";
  const precoText =
    $("[data-qa='product-price'], .price, .psw-price").first().text().trim() ||
    $("[data-qa='product-price-final']").text().trim() ||
    "";
  const preco = parsePreco(precoText);
  const descBlock =
    $("[data-qa='product-description'], .product-description, .long-description, [class*='description']").first();
  const descricao_raw = descBlock.length ? descBlock.text().trim() || null : null;

  if (!nome) return null;
  const idExterno = extrairId(productUrl, nome, 0);

  return {
    id_externo: idExterno,
    nome,
    imagem_url: melhorarUrlImagem(imagem.startsWith("http") ? imagem : ""),
    preco_original: preco,
    descricao_raw,
  };
}

/**
 * Busca um jogo na URL da página de produto da PlayStation Store (ex.: .../product/EP3969-...).
 * Retorna nome, preço, imagem e descrição bruta (para converter em HTML estilo PS).
 */
export async function buscarJogoPlayStation(
  url: string
): Promise<{ ok: boolean; jogo: JogoScraped | null; erro?: string }> {
  const urlNorm = url?.trim();
  if (!urlNorm || !urlNorm.includes("store.playstation.com") || !urlNorm.includes("/product/")) {
    return {
      ok: false,
      jogo: null,
      erro: "URL deve ser de uma página de produto da PlayStation Store (ex.: .../product/...).",
    };
  }
  try {
    const res = await fetch(urlNorm, {
      headers: HEADERS,
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return {
        ok: false,
        jogo: null,
        erro: `Página retornou ${res.status}. A PlayStation pode bloquear requisições do servidor.`,
      };
    }
    const html = await res.text();
    let jogo = extrairJogoDeJsonEmbutido(html, urlNorm);
    if (!jogo) {
      const $ = cheerio.load(html);
      jogo = extrairJogoDeHtml($, urlNorm);
    }
    if (!jogo) {
      return {
        ok: false,
        jogo: null,
        erro: "Não foi possível extrair dados do produto. A estrutura da página pode ter mudado.",
      };
    }
    if (jogo.preco_original < 1) {
      const precoHtml = extrairPrecoDoHtml(html);
      if (precoHtml >= 1) jogo = { ...jogo, preco_original: precoHtml };
    }
    return { ok: true, jogo };
  } catch (e) {
    console.error(e);
    return {
      ok: false,
      jogo: null,
      erro: e instanceof Error ? e.message : "Erro ao buscar página do jogo",
    };
  }
}

/**
 * Converte descrição em texto estilo PlayStation (■ títulos, listas com • ou -, títulos em maiúsculas) em HTML.
 * Padrão: ■ Título de seção (strong branco), "Label:" + lista, listas com • ou -, parágrafos com classes.
 */
export function descricaoPlayStationParaHtml(raw: string): string {
  if (!raw || !raw.trim()) return "";
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const out: string[] = [];
  let i = 0;
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  while (i < lines.length) {
    const line = lines[i];
    // Título de seção com quadrado preto (■ Conteúdo, ■ Um vasto mundo...)
    if (/^■\s*/.test(line) || line.startsWith("■")) {
      out.push(`<p class="mb-2 mt-4 first:mt-0"><strong class="text-white">${escape(line)}</strong></p>`);
      i++;
      continue;
    }
    // Linha que é um rótulo seguido de ":" (ex.: "4 trajes:", "Visual de arma:") — próxima(s) são bullets
    if (/:$/.test(line) && !/^[•\-]\s+/.test(line)) {
      out.push(`<p class="mb-2 mt-4 first:mt-0"><strong class="text-white">${escape(line)}</strong></p>`);
      i++;
      const listItems: string[] = [];
      while (i < lines.length && /^[•\-]\s+/.test(lines[i])) {
        listItems.push(`<li class="ml-4">${escape(lines[i].replace(/^[•\-]\s+/, ""))}</li>`);
        i++;
      }
      if (listItems.length > 0) {
        out.push(`<ul class="list-disc pl-6 mb-4 space-y-1 text-zinc-300">${listItems.join("")}</ul>`);
      }
      continue;
    }
    // Bullet solto (lista sem rótulo acima)
    if (/^[•\-]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[•\-]\s+/.test(lines[i])) {
        listItems.push(`<li class="ml-4">${escape(lines[i].replace(/^[•\-]\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ul class="list-disc pl-6 mb-4 space-y-1 text-zinc-300">${listItems.join("")}</ul>`);
      continue;
    }
    // Título em maiúsculas (estilo PS: "TORNA-TE NO 007") — próxima linha é o corpo
    const isAllCaps = line.length <= 100 && line.length >= 2 && /^[A-Z0-9\s\u00C0-\u024F\-–—'']+$/.test(line);
    if (isAllCaps && i + 1 < lines.length && lines[i + 1] && !/^[•\-]\s+/.test(lines[i + 1]) && !/:$/.test(lines[i + 1])) {
      out.push(`<p class="mt-6 mb-2"><strong class="text-white font-semibold">${escape(line)}</strong></p>`);
      i++;
      out.push(`<p class="mb-4 text-zinc-300">${escape(lines[i])}</p>`);
      i++;
      continue;
    }
    // Parágrafo normal
    out.push(`<p class="mb-4 text-zinc-300">${escape(line)}</p>`);
    i++;
  }
  return out.join("\n");
}

/**
 * Converte descrição em texto estilo PlayStation para HTML no formato do editor (Editar produto).
 * Mesma estrutura que descricaoPlayStationParaHtml, mas sem classes CSS, para ser igual ao que
 * o RichTextEditor grava e exibir o mesmo formato em Importar jogo e em Editar produto.
 */
export function descricaoPlayStationParaHtmlEditor(raw: string): string {
  if (!raw || !raw.trim()) return "";
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const out: string[] = [];
  let i = 0;
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  while (i < lines.length) {
    const line = lines[i];
    if (/^■\s*/.test(line) || line.startsWith("■")) {
      out.push(`<p><strong>${escape(line)}</strong></p>`);
      i++;
      continue;
    }
    if (/:$/.test(line) && !/^[•\-]\s+/.test(line)) {
      out.push(`<p><strong>${escape(line)}</strong></p>`);
      i++;
      const listItems: string[] = [];
      while (i < lines.length && /^[•\-]\s+/.test(lines[i])) {
        listItems.push(`<li>${escape(lines[i].replace(/^[•\-]\s+/, ""))}</li>`);
        i++;
      }
      if (listItems.length > 0) {
        out.push(`<ul>${listItems.join("")}</ul>`);
      }
      continue;
    }
    if (/^[•\-]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[•\-]\s+/.test(lines[i])) {
        listItems.push(`<li>${escape(lines[i].replace(/^[•\-]\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ul>${listItems.join("")}</ul>`);
      continue;
    }
    const isAllCaps = line.length <= 100 && line.length >= 2 && /^[A-Z0-9\s\u00C0-\u024F\-–—'']+$/.test(line);
    if (isAllCaps && i + 1 < lines.length && lines[i + 1] && !/^[•\-]\s+/.test(lines[i + 1]) && !/:$/.test(lines[i + 1])) {
      out.push(`<p><strong>${escape(line)}</strong></p>`);
      i++;
      out.push(`<p>${escape(lines[i])}</p>`);
      i++;
      continue;
    }
    out.push(`<p>${escape(line)}</p>`);
    i++;
  }
  return out.join("\n");
}

/**
 * Converte HTML da descrição (gerado por descricaoPlayStationParaHtml) de volta para texto
 * no estilo do campo de Importar jogo (■, •, parágrafos por linha), para exibir no textarea de Editar produto.
 */
export function descricaoHtmlParaTexto(rawHtml: string): string {
  if (!rawHtml || !rawHtml.trim()) return "";
  let s = rawHtml.trim();
  s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = s.replace(/<\/p>\s*/gi, "\n").replace(/<\/li>\s*/gi, "\n");
  s = s.replace(/<p[^>]*>/gi, "").replace(/<li[^>]*>/gi, "• ").replace(/<ul[^>]*>/gi, "").replace(/<\/ul>/gi, "");
  s = s.replace(/<strong[^>]*>/gi, "").replace(/<\/strong>/gi, "");
  s = s.replace(/<[^>]+>/g, "");
  s = s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
  return s
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .trim();
}

/**
 * Busca ofertas na URL (PlayStation Store ou outra com estrutura similar).
 * @param url - URL base (ex.: .../deals ou .../category/uuid/1)
 * @param numPaginas - Quantas páginas buscar (1 a 186; recomendado não exceder 20 por vez para não sobrecarregar).
 */
export async function buscarOfertasPlayStation(
  url: string = DEALS_URL,
  numPaginas: number = 1
): Promise<{ ok: boolean; ofertas: OfertaScraped[]; erro?: string }> {
  const paginas = Math.max(1, Math.min(Number(numPaginas) || 1, 186));
  const todasOfertas: OfertaScraped[] = [];
  const idsVistos = new Set<string>();

  try {
    for (let p = 1; p <= paginas; p++) {
      const pageUrl = urlParaPagina(url, p);
      const res = await buscarUmaPagina(pageUrl);

      if (!res.ok) {
        if (p === 1) return { ok: false, ofertas: [], erro: res.erro };
        break;
      }

      for (const o of res.ofertas) {
        if (!idsVistos.has(o.id_externo)) {
          idsVistos.add(o.id_externo);
          todasOfertas.push(o);
        }
      }

      if (res.ofertas.length === 0 && p > 1) break;
      if (p < paginas) await new Promise((r) => setTimeout(r, 400));
    }

    if (todasOfertas.length === 0) {
      return {
        ok: false,
        ofertas: [],
        erro: "Nenhuma oferta encontrada. A estrutura da página pode ter mudado ou o conteúdo é carregado por JavaScript.",
      };
    }

    return { ok: true, ofertas: todasOfertas };
  } catch (e) {
    console.error(e);
    return {
      ok: false,
      ofertas: [],
      erro: e instanceof Error ? e.message : "Erro ao buscar ofertas",
    };
  }
}
