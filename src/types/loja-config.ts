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

/** Ícone do Mercado Pago exibido na página de produto. Dimensões: 64×64 px */
export type IconeMercadoPagoConfig = { url: string } | null;
/** Ícone do Pix exibido na página de produto. Dimensões: 64×64 px */
export type IconePixConfig = { url: string } | null;
/** Ícone do PS4 exibido no seletor de console. Dimensões: 64×64 px */
export type IconePS4Config = { url: string } | null;
/** Ícone do PS5 exibido no seletor de console. Dimensões: 64×64 px */
export type IconePS5Config = { url: string } | null;

/** Item do banner divisor (entre carousel e pré-venda) */
export type BannerDivisorItem = {
  icone_url?: string | null;
  titulo: string;
  descricao: string;
};

/** Configuração do banner divisor exibido na home page */
export type BannerDivisorConfig = {
  ativo: boolean;
  titulo_principal: string;
  imagem_fundo_url?: string | null;
  itens: BannerDivisorItem[];
} | null;

/** HTML exibido na seção "Informações adicionais" em todas as páginas de produto. */
export type InformacoesAdicionaisConfig = { html: string } | null;

/** Configuração global da promoção de "Ofertas especiais" (menu principal). */
export type OfertasEspeciaisConfig = {
  /** Nome interno da promoção, apenas para controle. */
  nome: string;
  /** Data/hora final da promoção (ISO 8601). */
  dataFinal: string;
} | null;

/** Notificação de novo pedido no WhatsApp do lojista (CallMeBot – gratuito). */
export type WhatsappNotificacaoConfig = {
  ativo: boolean;
  /** Número com DDD, sem + (ex.: 5579999204322). */
  numero: string;
  /** Chave recebida ao ativar CallMeBot no WhatsApp. */
  apikey: string;
} | null;

/** Configuração do Mercado Pago (Checkout Transparente). Access Token só no servidor. */
export type MercadoPagoConfig = {
  publicKey: string;
  accessToken: string;
  sandbox: boolean;
  /** Taxa aplicada ao pagamento com cartão (em %). Padrão: 5% */
  taxaCartao?: number;
} | null;

/** Configuração do PagBank (Checkout / Link de Pagamento via redirect). */
export type PagBankConfig = {
  /** Token de autenticação enviado em `Authorization: Bearer <token>` (iBanking). */
  token: string;
  /** Sandbox (true) usa https://sandbox.api.pagseguro.com */
  sandbox: boolean;
  /** Limite de parcelas no cartão (padrão 12). */
  installments_limit?: number;
  /**
   * Parcelas sem juros pagas pelo vendedor.
   * Se não informado (ou 0), o comprador paga os juros (padrão recomendado).
   */
  interest_free_installments?: number;
  /** Texto que aparece na fatura (até 17 caracteres). */
  soft_descriptor?: string;
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
  /** Ícone do Mercado Pago para página de produto */
  icone_mercado_pago: IconeMercadoPagoConfig;
  /** Ícone do Pix para página de produto */
  icone_pix: IconePixConfig;
  /** Ícone do PS4 para seletor de console */
  icone_ps4: IconePS4Config;
  /** Ícone do PS5 para seletor de console */
  icone_ps5: IconePS5Config;
  /** Banner divisor entre carousel e pré-venda */
  banner_divisor: BannerDivisorConfig;
  /** Notificação de pedido no seu WhatsApp (CallMeBot). */
  whatsapp_notificacao: WhatsappNotificacaoConfig;
  /** Credenciais e opções do PagBank. */
  pagbank: PagBankConfig;
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
  icone_mercado_pago: null as IconeMercadoPagoConfig,
  icone_pix: null as IconePixConfig,
  icone_ps4: null as IconePS4Config,
  icone_ps5: null as IconePS5Config,
  banner_divisor: {
    ativo: true,
    titulo_principal: "GARANTIA EASY GAMES: DO PRESENTE PARA O FUTURO.",
    imagem_fundo_url: null,
    itens: [
      {
        icone_url: null,
        titulo: "COMPRA SEGURA & PROTEÇÃO TOTAL",
        descricao: "Garantia de recebimento ou seu dinheiro de volta.",
      },
      {
        icone_url: null,
        titulo: "ENVIO IMEDIATO & DIGITAL",
        descricao: "Seus códigos em segundos, jogue agora.",
      },
      {
        icone_url: null,
        titulo: "ECOSSISTEMA COMPLETO GAMER",
        descricao: "De clássicos a pré-vendas, tudo em um só lugar.",
      },
    ],
  } as BannerDivisorConfig,
  whatsapp_notificacao: null as WhatsappNotificacaoConfig,
  pagbank: null as PagBankConfig,
};

export { DEFAULTS };
