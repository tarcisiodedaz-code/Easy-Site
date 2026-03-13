"use client";

import { useState, useMemo } from "react";
import {
  deleteCustomer,
  sendResetPasswordEmail,
  updateCustomer,
  setCustomerActive,
  type CustomerRow,
} from "./actions";

type Props = { customers: CustomerRow[] };

function formatDataCadastro(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const IconPencil = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);
const IconKey = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);
const IconBlock = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);
const IconCheck = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconTrash = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export function ListaClientesAdmin({ customers: initial }: Props) {
  const [customers, setCustomers] = useState(initial);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [editModal, setEditModal] = useState<CustomerRow | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone_number: "" });

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.full_name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q)
    );
  }, [customers, busca]);

  function openEdit(c: CustomerRow) {
    setEditModal(c);
    setEditForm({
      full_name: c.full_name || "",
      email: c.email || "",
      phone_number: c.phone_number || "",
    });
    setMessage(null);
  }

  async function handleSaveEdit() {
    if (!editModal) return;
    setLoading(editModal.id);
    setMessage(null);
    const { ok, error } = await updateCustomer(editModal.id, editForm);
    setLoading(null);
    if (ok) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === editModal.id ? { ...c, ...editForm } : c))
      );
      setEditModal(null);
      setMessage({ type: "ok", text: "Cliente atualizado." });
    } else {
      setMessage({ type: "err", text: error ?? "Erro ao atualizar." });
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Excluir este usuário? O perfil e o acesso (Auth) serão removidos.")) return;
    setLoading(userId);
    setMessage(null);
    const { ok, error } = await deleteCustomer(userId);
    setLoading(null);
    if (ok) {
      setCustomers((prev) => prev.filter((c) => c.id !== userId));
      setEditModal((m) => (m?.id === userId ? null : m));
      setMessage({ type: "ok", text: "Usuário excluído." });
    } else {
      setMessage({ type: "err", text: error ?? "Erro ao excluir." });
    }
  }

  async function handleResetPassword(email: string) {
    setLoading(`pwd-${email}`);
    setMessage(null);
    const { ok, error } = await sendResetPasswordEmail(email);
    setLoading(null);
    if (ok) {
      setMessage({ type: "ok", text: "E-mail de recuperação de senha enviado." });
    } else {
      setMessage({ type: "err", text: error ?? "Erro ao enviar e-mail." });
    }
  }

  async function handleToggleAtivo(c: CustomerRow) {
    const novoAtivo = !c.ativo;
    setLoading(`ativo-${c.id}`);
    setMessage(null);
    const { ok, error } = await setCustomerActive(c.id, novoAtivo);
    setLoading(null);
    if (ok) {
      setCustomers((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, ativo: novoAtivo } : x))
      );
      setMessage({
        type: "ok",
        text: novoAtivo ? "Cliente ativado." : "Cliente desativado. O login será bloqueado.",
      });
    } else {
      setMessage({ type: "err", text: error ?? "Erro ao alterar status." });
    }
  }

  return (
    <div className="space-y-4">
      {/* Busca por nome ou e-mail */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-xs rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
        />
        {busca.trim() && (
          <span className="text-sm text-zinc-500">
            {filtrados.length} de {customers.length}
          </span>
        )}
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${message.type === "ok" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
        >
          {message.text}
        </div>
      )}

      {filtrados.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-zinc-400">
          {customers.length === 0
            ? "Nenhum cliente cadastrado."
            : "Nenhum resultado para a busca."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-zinc-900/50">
                  <th className="px-4 py-3 font-medium text-zinc-300">Nome Completo</th>
                  <th className="px-4 py-3 font-medium text-zinc-300">E-mail</th>
                  <th className="px-4 py-3 font-medium text-zinc-300">Número (WhatsApp)</th>
                  <th className="px-4 py-3 font-medium text-zinc-300">Data de Cadastro</th>
                  <th className="px-4 py-3 font-medium text-zinc-300 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-b border-[var(--border)] last:border-0 ${!c.ativo ? "opacity-70" : ""}`}
                  >
                    <td className="px-4 py-3 text-white">{c.full_name || "—"}</td>
                    <td className="px-4 py-3 text-zinc-300">{c.email}</td>
                    <td className="px-4 py-3 text-zinc-400">{c.phone_number || "—"}</td>
                    <td className="px-4 py-3 text-zinc-500">{formatDataCadastro(c.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          disabled={loading !== null}
                          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                          title="Editar"
                        >
                          <IconPencil />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetPassword(c.email)}
                          disabled={loading !== null}
                          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-amber-400 disabled:opacity-50"
                          title="Redefinir senha"
                        >
                          <IconKey />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAtivo(c)}
                          disabled={loading !== null}
                          className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                            c.ativo
                              ? "text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
                              : "text-emerald-400 hover:bg-zinc-800 hover:text-emerald-300"
                          }`}
                          title={c.ativo ? "Desativar cliente" : "Ativar cliente"}
                        >
                          {c.ativo ? <IconBlock /> : <IconCheck />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          disabled={loading !== null}
                          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                          title="Excluir"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !loading && setEditModal(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">Editar cliente</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Nome</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">E-mail</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Celular (WhatsApp)</label>
                <input
                  type="text"
                  value={editForm.phone_number}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone_number: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white placeholder-zinc-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditModal(null)}
                disabled={!!loading}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!!loading}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {loading === editModal.id ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
