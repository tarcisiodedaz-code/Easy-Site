/**
 * Busca capa de jogo em alta resolução na RAWG (rawg.io).
 * Use ao salvar produto para substituir imagens de baixa qualidade da PlayStation.
 * Chave gratuita: https://rawg.io/apidocs
 */

const RAWG_API = "https://api.rawg.io/api/games";

/**
 * Limpa o nome do jogo para melhor resultado na busca (remove plataforma, edição, etc.).
 */
function limparNomeParaBusca(nome: string): string {
  return nome
    .replace(/\s*\(PlayStation®?\s*5\)\s*/gi, " ")
    .replace(/\s*\(PlayStation®?\s*4\)\s*/gi, " ")
    .replace(/\s*PS5\s*/gi, " ")
    .replace(/\s*PS4\s*/gi, " ")
    .replace(/\s*Edição\s+[^|]+/gi, " ")
    .replace(/\s*Deluxe\s*Edition\s*/gi, " ")
    .replace(/\s*-\s*[^-]+$/, "") // remove último sufixo após -
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * Busca um jogo por nome na RAWG e retorna a URL da imagem de capa (background_image) em alta resolução.
 * Retorna null se não encontrar ou se a chave não estiver configurada.
 */
export async function buscarCapaAltaPorNome(nomeJogo: string): Promise<string | null> {
  const key = process.env.RAWG_API_KEY;
  if (!key) return null;

  const query = encodeURIComponent(limparNomeParaBusca(nomeJogo));
  const url = `${RAWG_API}?search=${query}&page_size=1&key=${key}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: { background_image?: string }[] };
    const img = data?.results?.[0]?.background_image;
    return typeof img === "string" && img.startsWith("http") ? img : null;
  } catch {
    return null;
  }
}
