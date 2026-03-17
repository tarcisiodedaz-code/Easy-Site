"use server";

import { setLojaConfig } from "@/lib/loja-config";

export async function salvarPersonalise(logoUrl: string | null, faviconUrl: string | null) {
  const [rLogo, rFavicon] = await Promise.all([
    setLojaConfig("logo_marca", logoUrl ? { url: logoUrl } : null),
    setLojaConfig("favicon", faviconUrl ? { url: faviconUrl } : null),
  ]);
  if (!rLogo.ok) return { ok: false, erro: rLogo.error };
  if (!rFavicon.ok) return { ok: false, erro: rFavicon.error };
  return { ok: true };
}

/** Salva o conteúdo global "Informações adicionais" exibido em todas as páginas de produto. */
export async function salvarInformacoesAdicionais(html: string | null) {
  const res = await setLojaConfig("informacoes_adicionais", html?.trim() ? { html: html.trim() } : null);
  return res.ok ? { ok: true as const } : { ok: false as const, erro: res.error };
}
