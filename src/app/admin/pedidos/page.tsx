import { getPedidos } from "@/lib/pedidos";
import { ListaPedidosAdmin } from "./ListaPedidosAdmin";

type SearchParams = { situacao?: string; forma_pagamento?: string; pagina?: string };

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const situacao = params.situacao as "pendente" | "pago" | "cancelado" | "entregue" | undefined;
  const forma_pagamento = params.forma_pagamento as "mercado_pago" | "pix" | undefined;
  const pagina = params.pagina ? Number(params.pagina) : 1;

  const { pedidos, total, paginas } = await getPedidos({
    situacao,
    forma_pagamento,
    pagina,
    por_pagina: 50,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">Pedidos</h1>
        <p className="mt-2 text-zinc-400">
          Filtros por situação e forma de pagamento. Ações: ver detalhes, reenviar e-mail, cancelar.
        </p>
      </header>

      <ListaPedidosAdmin
        pedidos={pedidos}
        total={total}
        paginas={paginas}
        paginaAtual={pagina}
        filtroSituacao={situacao}
        filtroFormaPagamento={forma_pagamento}
      />
    </div>
  );
}
