export type UtilityBarItem = { icon: string; label: string };
export type CarouselSlide = { image: string; title: string; link: string };
export type PreSaleConfig = {
  titulo: string;
  subtitulo: string;
  dataFinal: string;
  imagem_fundo?: string;
  /** Capa do jogo exibida no banner (upload). Dimensões recomendadas: 320×420 px. */
  imagem_capa?: string;
};
export type NavPlatformItem = { label: string; href: string; icon: string };

export type LogoMarcaConfig = { url: string } | null;
export type FaviconConfig = { url: string } | null;

/** HTML exibido na seção "Informações adicionais" em todas as páginas de produto. */
export type InformacoesAdicionaisConfig = { html: string } | null;

/** Configuração global da promoção de "Ofertas especiais" (menu principal). */
export type OfertasEspeciaisConfig = {
  /** Nome interno da promoção, apenas para controle. */
  nome: string;
  /** Data/hora final da promoção (ISO 8601). */
  dataFinal: string;
} | null;

/** Configuração do Mercado Pago (Checkout Transparente). Access Token só no servidor. */
export type MercadoPagoConfig = {
  publicKey: string;
  accessToken: string;
  sandbox: boolean;
} | null;

export type LojaConfigMap = {
  utility_bar: UtilityBarItem[];
  carousel: CarouselSlide[];
  pre_sale: PreSaleConfig;
  nav_platforms: NavPlatformItem[];
  logo_marca: LogoMarcaConfig;
  favicon: FaviconConfig;
  /** Conteúdo global exibido em todas as páginas de produto (seção "Informações adicionais"). */
  informacoes_adicionais: InformacoesAdicionaisConfig;
  /** Promoção global usada no botão/menu "Ofertas especiais". */
  ofertas_especiais: OfertasEspeciaisConfig;
  /** Credenciais Mercado Pago (Public Key, Access Token, sandbox). */
  mercado_pago: MercadoPagoConfig;
};

const DEFAULTS: LojaConfigMap = {
  utility_bar: [
    { icon: "lock", label: "LOJA SEGURA" },
    { icon: "fast", label: "ENVIO IMEDIATO" },
    { icon: "controller", label: "JOGOS DIGITAIS" },
  ],
  carousel: [
    { image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=85", title: "Final Fantasy VII Rebirth", link: "/categorias/ofertas" },
    { image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=85", title: "Marvel's Spider-Man 2", link: "/categorias/ofertas" },
    { image: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=1200&q=85", title: "Tekken 8", link: "/categorias/ofertas" },
  ],
  pre_sale: {
    titulo: "PRÉ-VENDA: GTA VI",
    subtitulo: "LANÇAMENTO EM",
    dataFinal: "2026-09-17T00:00:00",
  },
  nav_platforms: [
    { label: "PLAYSTATION 4", href: "/categorias/ofertas", icon: "ps4" },
    { label: "PLAYSTATION 5", href: "/categorias/ofertas", icon: "ps5" },
    { label: "GIFT CARD", href: "/categorias/ofertas", icon: "gift" },
    { label: "OFERTA", href: "/categorias/ofertas", icon: "tag" },
  ],
  logo_marca: null as LogoMarcaConfig,
  favicon: null as FaviconConfig,
  informacoes_adicionais: null as InformacoesAdicionaisConfig,
  ofertas_especiais: null,
  mercado_pago: null as MercadoPagoConfig,
};

export { DEFAULTS };
