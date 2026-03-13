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
  /** Preço promocional; se null/0 ou fora do período, não exibe tarja/riscado */
  preco_promocional?: number | null;
  oferta_inicio?: string | null;
  oferta_fim?: string | null;
  /** Vitrine: exibir na seção "Lançamentos" */
  is_lancamento?: boolean;
  /** Vitrine: exibir na seção "Mais Vendidos" */
  is_mais_vendido?: boolean;
};
