"use server";

import { validateAdminSession } from "@/lib/auth-admin";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/produtos-completo";
import { ensureSlugUnicoCategoria } from "@/lib/slug-unico";

export type CategoriaProdutoAdmin = {
  id: string;
  nome: string;
  descricao: string | null;
  slug: string | null;
  ativo: boolean;
  icon_url: string | null;
  parent_id: string | null;
  created_at?: string;
};

export async function getCategoriasProdutoAdmin(): Promise<CategoriaProdutoAdmin[]> {
  if (!(await validateAdminSession())) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categorias_produto")
    .select("id, nome, descricao, slug, ativo, icon_url, parent_id, created_at")
    .order("nome");
  if (error) return [];
  const rows = (data ?? []) as (CategoriaProdutoAdmin & { ativo?: boolean })[];
  return rows.map((r) => ({ ...r, ativo: r.ativo !== false }));
}

export async function criarCategoriaProduto(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { ok: false, erro: "Nome é obrigatório." };
  const slugRaw = (formData.get("slug") as string)?.trim() || slugify(nome);
  const supabase = createAdminClient();
  const slug = await ensureSlugUnicoCategoria(supabase, slugRaw);
  const descricao = (formData.get("descricao") as string)?.trim() || null;
  const ativo = formData.get("ativo") === "true";
  const iconUrl = (formData.get("icon_url") as string)?.trim() || null;
  const parentId = (formData.get("parent_id") as string)?.trim() || null;
  const { error } = await supabase.from("categorias_produto").insert({
    nome,
    descricao,
    slug: slug || null,
    ativo,
    icon_url: iconUrl,
    parent_id: parentId || null,
  });
  if (error) return { ok: false, erro: error.message };
  revalidatePath("/admin/produtos/categorias");
  return { ok: true };
}

export async function atualizarCategoriaProduto(
  id: string,
  formData: FormData
): Promise<{ ok: boolean; erro?: string }> {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { ok: false, erro: "Nome é obrigatório." };
  const slugRaw = (formData.get("slug") as string)?.trim() || slugify(nome);
  const supabase = createAdminClient();
  const slug = await ensureSlugUnicoCategoria(supabase, slugRaw, id);
  const descricao = (formData.get("descricao") as string)?.trim() || null;
  const ativo = formData.get("ativo") === "true";
  const iconUrl = (formData.get("icon_url") as string)?.trim() || null;
  const parentId = (formData.get("parent_id") as string)?.trim() || null;
  const { error } = await supabase
    .from("categorias_produto")
    .update({
      nome,
      descricao,
      slug: slug || null,
      ativo,
      icon_url: iconUrl,
      parent_id: parentId || null,
    })
    .eq("id", id);
  if (error) return { ok: false, erro: error.message };
  revalidatePath("/admin/produtos/categorias");
  return { ok: true };
}

export async function excluirCategoriaProduto(id: string): Promise<{ ok: boolean; erro?: string }> {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  const supabase = createAdminClient();
  const { error } = await supabase.from("categorias_produto").delete().eq("id", id);
  if (error) return { ok: false, erro: error.message };
  revalidatePath("/admin/produtos/categorias");
  return { ok: true };
}
