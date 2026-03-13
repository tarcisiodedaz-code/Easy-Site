import Image from "next/image";
import Link from "next/link";

type HeroBannerProps = {
  imagemUrl: string;
  imagemAlt: string;
  titulo: string;
  subtitulo?: string;
  ctaTexto?: string;
  ctaLink?: string;
};

export function HeroBanner({
  imagemUrl,
  imagemAlt,
  titulo,
  subtitulo,
  ctaTexto = "Ver lançamentos",
  ctaLink = "/categorias/ofertas",
}: HeroBannerProps) {
  return (
    <section className="relative h-[85vh] min-h-[520px] w-full overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={imagemUrl}
          alt={imagemAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={90}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/80 to-transparent"
          aria-hidden
        />
      </div>
      <div className="relative flex h-full flex-col justify-end px-4 pb-16 pt-28 sm:px-8 md:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
            {titulo}
          </h1>
          {subtitulo && (
            <p className="mt-4 max-w-2xl text-lg text-zinc-300 sm:text-xl">
              {subtitulo}
            </p>
          )}
          {ctaLink && (
            <Link
              href={ctaLink}
              className="mt-8 inline-flex items-center rounded-lg bg-[var(--accent)] px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-colors hover:bg-[var(--accent-hover)]"
            >
              {ctaTexto}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
