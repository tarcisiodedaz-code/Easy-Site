"use server";

import { setLojaConfig } from "@/lib/loja-config";

export async function salvarPersonalise(
  logoUrl: string | null,
  faviconUrl: string | null,
  iconeMercadoPagoUrl?: string | null,
  iconePixUrl?: string | null,
  iconePS4Url?: string | null,
  iconePS5Url?: string | null
) {
  const [rLogo, rFavicon, rMercadoPago, rPix, rPS4, rPS5] = await Promise.all([
    setLojaConfig("logo_marca", logoUrl ? { url: logoUrl } : null),
    setLojaConfig("favicon", faviconUrl ? { url: faviconUrl } : null),
    setLojaConfig("icone_mercado_pago", iconeMercadoPagoUrl ? { url: iconeMercadoPagoUrl } : null),
    setLojaConfig("icone_pix", iconePixUrl ? { url: iconePixUrl } : null),
    setLojaConfig("icone_ps4", iconePS4Url ? { url: iconePS4Url } : null),
    setLojaConfig("icone_ps5", iconePS5Url ? { url: iconePS5Url } : null),
  ]);
  if (!rLogo.ok) return { ok: false, erro: rLogo.error };
  if (!rFavicon.ok) return { ok: false, erro: rFavicon.error };
  if (!rMercadoPago.ok) return { ok: false, erro: rMercadoPago.error };
  if (!rPix.ok) return { ok: false, erro: rPix.error };
  if (!rPS4.ok) return { ok: false, erro: rPS4.error };
  if (!rPS5.ok) return { ok: false, erro: rPS5.error };
  return { ok: true };
}

/** Salva o conteúdo global "Informações adicionais" exibido em todas as páginas de produto. */
export async function salvarInformacoesAdicionais(html: string | null) {
  const res = await setLojaConfig("informacoes_adicionais", html?.trim() ? { html: html.trim() } : null);
  return res.ok ? { ok: true as const } : { ok: false as const, erro: res.error };
}
