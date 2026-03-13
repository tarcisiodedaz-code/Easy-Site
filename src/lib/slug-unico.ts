import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Garante um slug único em produtos_loja. Se o slug já existir, acrescenta -2, -3, etc.
 */
export async function ensureSlugUnicoProduto(
  supabase: SupabaseClient,
  slugBase: string,
  excludeProdutoId?: string
): Promise<string> {
  const base = slugBase.trim().toLowerCase() || "produto";
  let slug = base;
  let n = 1;
  for (;;) {
    let q = supabase.from("produtos_loja").select("id").eq("slug", slug).is("deletado_em", null);
    if (excludeProdutoId) q = q.neq("id", excludeProdutoId);
    const { data } = await q.maybeSingle();
    if (!data) return slug;
    slug = `${base}-${++n}`;
  }
}

/**
 * Garante um slug único em categorias_produto. Se o slug já existir, acrescenta -2, -3, etc.
 */
export async function ensureSlugUnicoCategoria(
  supabase: SupabaseClient,
  slugBase: string,
  excludeCategoriaId?: string
): Promise<string> {
  const base = slugBase.trim().toLowerCase() || "categoria";
  let slug = base;
  let n = 1;
  for (;;) {
    let q = supabase.from("categorias_produto").select("id").eq("slug", slug);
    if (excludeCategoriaId) q = q.neq("id", excludeCategoriaId);
    const { data } = await q.maybeSingle();
    if (!data) return slug;
    slug = `${base}-${++n}`;
  }
}
