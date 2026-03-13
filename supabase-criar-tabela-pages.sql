-- Criar tabela de páginas institucionais
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  conteudo TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca por slug
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);

-- Criar índice para ordenação
CREATE INDEX IF NOT EXISTS idx_pages_ordem ON pages(ordem);

-- Permitir acesso público para leitura (anon pode ler páginas ativas)
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de páginas ativas"
  ON pages FOR SELECT
  USING (ativo = true);

CREATE POLICY "Permitir todas operações para service_role"
  ON pages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Se quiser desabilitar RLS completamente (mais simples):
-- ALTER TABLE pages DISABLE ROW LEVEL SECURITY;

-- Inserir algumas páginas de exemplo (opcional)
INSERT INTO pages (titulo, slug, conteudo, ativo, ordem) VALUES
('Produto Digital', 'produto-digital', 'Todos os nossos jogos são digitais, adquiridos diretamente na PlayStation Store.', true, 1),
('Termos de Uso', 'termos-de-uso', 'Termos e condições de uso da loja Easy Games.', true, 2),
('Política de Privacidade', 'politica-de-privacidade', 'Nossa política de privacidade e proteção de dados.', true, 3),
('Política de Troca/Devolução', 'politica-de-troca-devolucao', 'Informações sobre trocas e devoluções.', true, 4),
('Sobre a Loja', 'sobre-a-loja', 'Conheça a Easy Games, sua loja de jogos digitais.', true, 5)
ON CONFLICT (slug) DO NOTHING;
