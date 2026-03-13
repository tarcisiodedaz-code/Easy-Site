/**
 * Garante que imagens da PlayStation Store sejam exibidas em alta resolução.
 * Usa a API da Sony (image.api.np.km.playstation.net) para redimensionar qualquer
 * imagem da PlayStation para 1200px de largura.
 */
const LARGURA_ALTA = 1200;
const IMAGE_API = "https://image.api.np.km.playstation.net/images/";

/**
 * Verifica se a URL é de um domínio PlayStation (gmedia, apollo, store).
 */
function isPlaystationImageUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host.includes("gmedia.playstation.com") ||
      host.includes("apollo2.dl.playstation.net") ||
      host.includes("store.playstation.com") ||
      host.includes("playstation.com") ||
      host.includes("playstation.net")
    );
  } catch {
    return false;
  }
}

/**
 * Retorna a URL da imagem em alta resolução (1200px de largura).
 * - gmedia: usa parâmetro wid= (Adobe Image Serving).
 * - Demais URLs PlayStation: usa a API da Sony para redimensionar.
 */
export function getImagemAltaResolucao(url: string | null | undefined): string {
  if (!url || !url.startsWith("http")) return url || "";
  if (!isPlaystationImageUrl(url)) return url;

  try {
    const u = new URL(url);
    if (u.hostname.includes("gmedia.playstation.com")) {
      u.searchParams.set("wid", String(LARGURA_ALTA));
      return u.toString();
    }
    const params = new URLSearchParams({
      format: "jpg",
      w: String(LARGURA_ALTA),
      image: url,
    });
    return IMAGE_API + "?" + params.toString();
  } catch {
    return url;
  }
}
