-- Permissões para o schema public
-- Execute no SQL Editor do Supabase (Dashboard), como owner do projeto.
-- Corrige "permission denied for schema public" no Admin (Clientes) e em outras consultas.

-- 1) Permitir USAGE no schema public para as roles do Supabase
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 2) Permitir que service_role faça tudo nas tabelas do public (admin, migrations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 3) Para anon e authenticated (loja, auth) – leitura/escrita conforme RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4) Tabela profiles: garantir que service_role possa listar/deletar (admin clientes)
GRANT SELECT, DELETE ON public.profiles TO service_role;

-- 5) (Opcional) Para novas tabelas criadas por você no futuro:
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
