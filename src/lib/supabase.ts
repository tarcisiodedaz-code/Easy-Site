import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Placeholder para build (ex.: Vercel) quando as variáveis ainda não estão disponíveis.
// Em produção, defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "placeholder-anon-key";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export type ProdutoLoja = {
  id?: string;
  nome: string;
  imagem_url: string | null;
  preco_original: number;
  preco: number;
  id_externo: string;
  url_origem: string | null;
  created_at?: string;
  /** Se true e quantidade_estoque <= 0, exibir como Indisponível e bloquear compra */
  gerenciar_estoque?: boolean;
  quantidade_estoque?: number;
  /** Preço promocional único (para os dois quando não usar por console) */
  preco_promocional?: number | null;
  /** Preço promocional só para PS4 */
  preco_promocional_ps4?: number | null;
  /** Preço promocional só para PS5 */
  preco_promocional_ps5?: number | null;
  /** Se true, loja usa preco_promocional_ps4 e preco_promocional_ps5; senão usa preco_promocional */
  usar_preco_promocional_por_console?: boolean;
  oferta_inicio?: string | null;
  oferta_fim?: string | null;
  /** Vitrine: exibir na seção "Lançamentos" */
  is_lancamento?: boolean;
  /** Vitrine: exibir na seção "Mais Vendidos" */
  is_mais_vendido?: boolean;
  /** Disponível para PlayStation 4 */
  disponivel_ps4?: boolean;
  /** Disponível para PlayStation 5 */
  disponivel_ps5?: boolean;
  /** Preço de custo das unidades PS4 (importação Estoque → Loja) */
  preco_custo_ps4?: number | null;
  /** Preço de custo das unidades PS5 (importação Estoque → Loja) */
  preco_custo_ps5?: number | null;
  /** Quantidade em estoque para PS4 */
  quantidade_estoque_ps4?: number | null;
  /** Quantidade em estoque para PS5 */
  quantidade_estoque_ps5?: number | null;
}
