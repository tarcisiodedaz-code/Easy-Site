"use server";

import { validateAdminSession } from "@/lib/auth-admin";
import {
  criarPagina,
  atualizarPagina,
  excluirPagina,
  gerarSlug,
} from "@/lib/paginas";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: true } | { ok: false; erro: string };

export async function criarPaginaAction(formData: FormData): Promise<ActionResult> {
  if (!(await validateAdminSession())) {
    return { ok: false, erro: "Não autorizado." };
  }

  const titulo = formData.get("titulo") as string;
  const slug = formData.get("slug") as string;
  const conteudo = formData.get("conteudo") as string;
  const ativo = formData.get("ativo") === "true";
  const ordem = parseInt(formData.get("ordem") as string) || 0;

  if (!titulo || !slug) {
    return { ok: false, erro: "Título e slug são obrigatórios." };
  }

  const pagina = await criarPagina({
    titulo,
    slug: gerarSlug(slug),
    conteudo: conteudo || null,
    ativo,
    ordem,
  });

  if (!pagina) {
    return { ok: false, erro: "Erro ao criar página. Verifique se o slug já existe." };
  }

  revalidatePath("/admin/configuracoes/paginas");
  revalidatePath("/");
  return { ok: true };
}

export async function atualizarPaginaAction(id: string, formData: FormData): Promise<ActionResult> {
  if (!(await validateAdminSession())) {
    return { ok: false, erro: "Não autorizado." };
  }

  const titulo = formData.get("titulo") as string;
  const slug = formData.get("slug") as string;
  const conteudo = formData.get("conteudo") as string;
  const ativo = formData.get("ativo") === "true";
  const ordem = parseInt(formData.get("ordem") as string) || 0;

  if (!titulo || !slug) {
    return { ok: false, erro: "Título e slug são obrigatórios." };
  }

  const ok = await atualizarPagina(id, {
    titulo,
    slug: gerarSlug(slug),
    conteudo: conteudo || null,
    ativo,
    ordem,
  });

  if (!ok) {
    return { ok: false, erro: "Erro ao atualizar página." };
  }

  revalidatePath("/admin/configuracoes/paginas");
  revalidatePath(`/pagina/${slug}`);
  revalidatePath("/");
  return { ok: true };
}

export async function excluirPaginaAction(id: string): Promise<ActionResult> {
  if (!(await validateAdminSession())) {
    return { ok: false, erro: "Não autorizado." };
  }

  const ok = await excluirPagina(id);

  if (!ok) {
    return { ok: false, erro: "Erro ao excluir página." };
  }

  revalidatePath("/admin/configuracoes/paginas");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleAtivoAction(id: string, ativo: boolean): Promise<ActionResult> {
  if (!(await validateAdminSession())) {
    return { ok: false, erro: "Não autorizado." };
  }

  const ok = await atualizarPagina(id, { ativo });

  if (!ok) {
    return { ok: false, erro: "Erro ao atualizar página." };
  }

  revalidatePath("/admin/configuracoes/paginas");
  revalidatePath("/");
  return { ok: true };
}
