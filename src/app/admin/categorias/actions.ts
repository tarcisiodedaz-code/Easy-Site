"use server";

import {
  criarCategoria as criar,
  atualizarCategoria as atualizar,
  excluirCategoria as excluir,
  salvarItensCategoria,
} from "@/lib/categorias";

export async function criarCategoria(formData: FormData) {
  const nome = formData.get("nome") as string;
  const href = (formData.get("href") as string) || undefined;
  const icon = (formData.get("icon") as string) || undefined;
  const icon_url = (formData.get("icon_url") as string) || undefined;
  const ordem = formData.get("ordem") ? Number(formData.get("ordem")) : 0;
  if (!nome?.trim()) return { ok: false, erro: "Nome é obrigatório." };
  const result = await criar({ nome: nome.trim(), href: href || null, icon: icon || null, icon_url: icon_url || null, ordem });
  if (!result) return { ok: false, erro: "Erro ao criar categoria." };
  return { ok: true, id: result.id };
}

export async function atualizarCategoria(
  id: string,
  formData: FormData
) {
  const nome = formData.get("nome") as string;
  const href = (formData.get("href") as string) || undefined;
  const icon = (formData.get("icon") as string) || undefined;
  const icon_url = (formData.get("icon_url") as string) || undefined;
  const ordem = formData.get("ordem") ? Number(formData.get("ordem")) : undefined;
  if (!nome?.trim()) return { ok: false, erro: "Nome é obrigatório." };
  const payload: Parameters<typeof atualizar>[1] = { nome: nome.trim(), href: href || null, icon: icon || null, ordem };
  if (icon_url !== undefined) payload.icon_url = icon_url || null;
  const ok = await atualizar(id, payload);
  if (!ok) return { ok: false, erro: "Erro ao atualizar." };
  const itensRaw = formData.get("itens") as string | null;
  if (itensRaw) {
    try {
      const itens = JSON.parse(itensRaw) as { label: string; href: string }[];
      await salvarItensCategoria(id, itens.map((item, i) => ({ ...item, ordem: i })));
    } catch {
      // ignore
    }
  }
  return { ok: true };
}

export async function excluirCategoria(id: string) {
  const ok = await excluir(id);
  return ok ? { ok: true } : { ok: false, erro: "Erro ao excluir." };
}
