export type OfertaImportada = {
  id_externo: string;
  nome: string;
  imagem_url: string;
  /** Preço com desconto na PS Store (verde) */
  preco_sony_verde: number;
  /** Preço cheio na PS Store (vermelho). Pode ser null se não houver desconto. */
  preco_sony_vermelho: number | null;
  /** Seu preço de custo (sempre metade do preço em verde) */
  preco_custo: number;
  /** Seu preço de venda normal (metade do preço em vermelho; se não houver vermelho, usa metade do verde) */
  preco_venda: number;
  /** Seu preço promocional (custo + faixa fixa: +10/+15/+20/+25) */
  preco_promocional: number;
  url_origem: string;
};

/** Jogo importado por URL da página do produto (com descrição estilo PlayStation). */
export type JogoImportado = {
  id_externo: string;
  nome: string;
  imagem_url: string;
  preco_original: number;
  preco_com_margem: number;
  url_origem: string;
  /** HTML da descrição (convertido no servidor ao importar). */
  descricao_html: string;
  /** Texto bruto da descrição (para preencher o campo de cima). */
  descricao_raw?: string;
};
