-- Desabilitar RLS na tabela pages (mais simples)
ALTER TABLE pages DISABLE ROW LEVEL SECURITY;

-- Dar permissões completas
GRANT ALL ON pages TO anon;
GRANT ALL ON pages TO authenticated;
GRANT ALL ON pages TO service_role;
