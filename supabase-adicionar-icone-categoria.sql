-- Adicionar campo icon_url à tabela categorias_produto
ALTER TABLE categorias_produto ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- Comentário para o campo
COMMENT ON COLUMN categorias_produto.icon_url IS 'URL do ícone customizado para exibir no menu de navegação';
