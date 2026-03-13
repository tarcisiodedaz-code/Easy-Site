import { listCustomers } from "./actions";
import { ListaClientesAdmin } from "./ListaClientesAdmin";

export default async function AdminCustomersPage() {
  const { data: customers, error } = await listCustomers();

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">Clientes</h1>
        <p className="mt-2 text-zinc-400">
          Lista de clientes cadastrados. É possível excluir usuário e enviar link de recuperação de senha.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 px-4 py-3 text-red-400">
          {error}
        </div>
      )}

      <ListaClientesAdmin customers={customers} />
    </div>
  );
}
