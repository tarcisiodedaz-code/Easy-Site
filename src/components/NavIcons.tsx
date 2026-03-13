const iconCls = "h-5 w-5 shrink-0";

/** Logo PlayStation (símbolo PS com curvas) - branco */
function PsIcon() {
  return (
    <svg className={iconCls} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M8.985 2.596v18.808l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.628-3.55-1.04-3.96-1.265-4.965-1.675C9.683 3.029 8.985 2.596 8.985 2.596zM6.212 2.614v18.808H3.56V2.614h2.653z" />
    </svg>
  );
}

/** Gift Card: retângulo com laço no canto superior esquerdo, gradiente roxo-azul → azul claro, brilho suave */
function GiftCardIcon() {
  return (
    <svg className={iconCls} viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id="nav-giftcard-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="60%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
        <filter id="nav-giftcard-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="2.5"
        fill="url(#nav-giftcard-gradient)"
        fillOpacity="0.35"
        stroke="url(#nav-giftcard-gradient)"
        strokeWidth="1.2"
        filter="url(#nav-giftcard-glow)"
      />
      {/* Laço/ribbon no canto superior esquerdo */}
      <path
        d="M4 5.5h3.5v1.8c0 .3.1.5.3.7l1 1c.2.2.2.5 0 .7l-1 1c-.2.2-.3.4-.3.7V12H4V5.5z"
        fill="url(#nav-giftcard-gradient)"
        fillOpacity="0.85"
      />
      <circle cx="5.2" cy="7" r="0.5" fill="url(#nav-giftcard-gradient)" fillOpacity="0.7" />
      {/* Faixa do cartão */}
      <rect x="2" y="10.5" width="20" height="1" fill="url(#nav-giftcard-gradient)" fillOpacity="0.45" />
    </svg>
  );
}

/** Chama Oferta: contornos definidos, gradiente laranja, efeito de brilho */
function FlameIcon() {
  return (
    <svg className={iconCls} viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id="nav-flame-gradient" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <filter id="nav-flame-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 0.4 0 0 0  0 0 0 0 0  0 0 0 0.8 0" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M12 23c4.97 0 9-3.134 9-7 0-2.5-1.5-4.5-3-6l-1.5 2.5c1.2 1.1 2.1 2.5 2.1 3.5 0 2.761-3.134 5-7 5s-7-2.239-7-5c0-1 .9-2.4 2.1-3.5L6 10c-1.5 1.5-3 3.5-3 6 0 3.866 4.03 7 9 7zm-3-9c0 1.5 1.5 3 3 3s3-1.5 3-3c0-.5-.2-1-.5-1.5L12 11l-2.5 2.5c-.3.5-.5 1-.5 1.5zM12 2C9.5 2 7 4 7 7c0 1.5 1 3 2 4l3-5 3 5c1-1 2-2.5 2-4 0-3-2.5-5-5-5z"
        fill="url(#nav-flame-gradient)"
        filter="url(#nav-flame-glow)"
      />
    </svg>
  );
}

export function getNavIcon(iconName: string | null) {
  switch (iconName) {
    case "clock":
      return (
        <svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "ps4":
    case "ps5":
      return <PsIcon />;
    case "gift":
    case "giftcard":
      return <GiftCardIcon />;
    case "tag":
      return (
        <svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
    case "flame":
    case "oferta":
      return <FlameIcon />;
    case "percent":
      return (
        <svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm3-2c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM6 6l12 12M6 18L18 6" />
        </svg>
      );
    case "pages":
    default:
      return (
        <svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
  }
}
