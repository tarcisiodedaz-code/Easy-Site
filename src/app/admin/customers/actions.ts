"use server";

import { validateAdminSession } from "@/lib/auth-admin";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export type CustomerRow = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  created_at: string;
  ativo: boolean;
};

export async function listCustomers(): Promise<{ data: CustomerRow[]; error: string | null }> {
  if (!(await validateAdminSession())) {
    return { data: [], error: "Não autorizado." };
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone_number, created_at, ativo")
    .order("created_at", { ascending: false });
  if (error) return { data: [], error: error.message };
  const rows = (data ?? []) as (CustomerRow & { ativo?: boolean })[];
  return {
    data: rows.map((r) => ({ ...r, ativo: (r as { ativo?: boolean }).ativo !== false })),
    error: null,
  };
}

export async function updateCustomer(
  userId: string,
  payload: { full_name: string; email: string; phone_number: string }
): Promise<{ ok: boolean; error?: string }> {
  if (!(await validateAdminSession())) {
    return { ok: false, error: "Não autorizado." };
  }
  const supabase = createAdminClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: payload.full_name.trim() || "",
      email: payload.email.trim(),
      phone_number: payload.phone_number.trim() || "",
    })
    .eq("id", userId);
  if (profileError) return { ok: false, error: profileError.message };
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    email: payload.email.trim(),
    user_metadata: { full_name: payload.full_name.trim(), phone_number: payload.phone_number.trim() },
  });
  if (authError) return { ok: false, error: authError.message };
  revalidatePath("/admin/customers");
  return { ok: true };
}

export async function setCustomerActive(userId: string, ativo: boolean): Promise<{ ok: boolean; error?: string }> {
  if (!(await validateAdminSession())) {
    return { ok: false, error: "Não autorizado." };
  }
  const supabase = createAdminClient();
  const { error } = await supabase.from("profiles").update({ ativo }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/customers");
  return { ok: true };
}

export async function deleteCustomer(userId: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await validateAdminSession())) {
    return { ok: false, error: "Não autorizado." };
  }
  const supabase = createAdminClient();
  const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteAuthError) {
    return { ok: false, error: deleteAuthError.message };
  }
  revalidatePath("/admin/customers");
  return { ok: true };
}

export async function sendResetPasswordEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await validateAdminSession())) {
    return { ok: false, error: "Não autorizado." };
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login`;
  const res = await fetch(`${url}/auth/v1/recover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ email, redirect_to: redirectTo }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: (body as { msg?: string }).msg ?? body?.error_description ?? "Falha ao enviar e-mail." };
  }
  revalidatePath("/admin/customers");
  return { ok: true };
}
