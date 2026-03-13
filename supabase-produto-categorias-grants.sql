-- Corrige "permission denied for table produto_categorias"
-- Execute no SQL Editor do Supabase (Dashboard).

GRANT ALL ON public.produto_categorias TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produto_categorias TO anon, authenticated;
