import { supabase } from "./supabase";
import { createAdminClient } from "./supabase-admin";

export type Pagina = {
  id: string;
  titulo: string;
  slug: string;
  conteudo: string | null;
  ativo: boolean;
  ordem: number;
  created_at: string;
};

export async function getPaginasAtivas(): Promise<Pagina[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (error) {
    console.error("Erro ao buscar páginas:", error);
    return [];
  }

  return (data ?? []) as Pagina[];
}

export async function getTodasPaginas(): Promise<Pagina[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .order("ordem", { ascending: true });

  if (error) {
    console.error("Erro ao buscar páginas:", error);
    return [];
  }

  return (data ?? []) as Pagina[];
}

export async function getPaginaPorSlug(slug: string): Promise<Pagina | null> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("ativo", true)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar página:", error);
    return null;
  }

  return data as Pagina | null;
}

export async function getPaginaPorId(id: string): Promise<Pagina | null> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar página:", error);
    return null;
  }

  return data as Pagina | null;
}

export async function criarPagina(pagina: Omit<Pagina, "id" | "created_at">): Promise<Pagina | null> {
  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("pages")
      .insert(pagina)
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar página:", error);
      return null;
    }

    return data as Pagina;
  } catch (e) {
    console.error("Erro ao criar página:", e);
    return null;
  }
}

export async function atualizarPagina(
  id: string,
  pagina: Partial<Omit<Pagina, "id" | "created_at">>
): Promise<boolean> {
  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("pages")
      .update(pagina)
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar página:", error);
      return false;
    }

    return true;
  } catch (e) {
    console.error("Erro ao atualizar página:", e);
    return false;
  }
}

export async function excluirPagina(id: string): Promise<boolean> {
  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("pages")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir página:", error);
      return false;
    }

    return true;
  } catch (e) {
    console.error("Erro ao excluir página:", e);
    return false;
  }
}

export function gerarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
