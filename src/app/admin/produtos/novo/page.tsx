import Link from "next/link";
import { getCategoriasProduto } from "@/lib/produtos-completo";
import { FormNovoProduto } from "./FormNovoProduto";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  nome?: string;
  preco_custo?: string;
  preco_custo_ps4?: string;
  preco_custo_ps5?: string;
  preco?: string;
  preco_promocional?: string;
  preco_promocional_ps4?: string;
  preco_promocional_ps5?: string;
  usar_preco_promocional_por_console?: string;
  quantidade_estoque?: string;
  quantidade_estoque_ps4?: string;
  quantidade_estoque_ps5?: string;
  gerenciar_estoque?: string;
  disponivel_ps4?: string;
  disponivel_ps5?: string;
  embed?: string;
  ofertas?: string;
}>;

function toStr(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] ?? "" : v ?? "";
}

export default async function NovoProdutoPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const categorias = await getCategoriasProduto();
  const marcarOfertas = toStr(params.ofertas) === "1";
  const categoriaOfertas = marcarOfertas
    ? categorias.find((c) => c.nome.toLowerCase().trim() === "ofertas")
    : null;

  const hasPrefill = Boolean(toStr(params.nome)) || marcarOfertas;
  const initialValues = hasPrefill
    ? {
        nome: toStr(params.nome),
        precoCusto: toStr(params.preco_custo),
        precoCustoPs4: toStr(params.preco_custo_ps4),
        precoCustoPs5: toStr(params.preco_custo_ps5),
        precoVenda: toStr(params.preco),
        precoPromocional: toStr(params.preco_promocional),
        precoPromocionalPs4: toStr(params.preco_promocional_ps4),
        precoPromocionalPs5: toStr(params.preco_promocional_ps5),
        usarPrecoPromocionalPorConsole: toStr(params.usar_preco_promocional_por_console) === "true",
        quantidadeEstoque: toStr(params.quantidade_estoque) || "0",
        quantidadeEstoquePs4: toStr(params.quantidade_estoque_ps4) || "0",
        quantidadeEstoquePs5: toStr(params.quantidade_estoque_ps5) || "0",
        gerenciarEstoque: toStr(params.gerenciar_estoque) === "true",
        disponivelPs4: toStr(params.disponivel_ps4) !== "false",
        disponivelPs5: toStr(params.disponivel_ps5) !== "false",
        categoriaIds: categoriaOfertas ? [categoriaOfertas.id] : undefined,
      }
    : undefined;

  const isEmbed = toStr(params.embed) === "1";

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {!isEmbed && (
        <Link href="/admin/produtos" className="mb-8 inline-block text-sm text-zinc-400 hover:text-white">
          ← Listar Produtos
        </Link>
      )}
      <h1 className="text-2xl font-bold text-white">Cadastrar produto</h1>
      <p className="mt-1 text-zinc-400">
        {hasPrefill
          ? "Campos preenchidos com as regras de importação do estoque. Ajuste se quiser e cadastre."
          : "Preencha as informações e clique em Cadastrar para salvar na loja."}
      </p>
      <FormNovoProduto categorias={categorias} initialValues={initialValues} embed={isEmbed} />
    </div>
  );
}
