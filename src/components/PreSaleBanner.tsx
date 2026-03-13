import Image from "next/image";
import { CountdownTimer } from "./CountdownTimer";

type PreSaleBannerProps = {
  dataFinal: string;
  titulo?: string;
  subtitulo?: string;
  imagem_fundo?: string | null;
  imagem_capa?: string | null;
};

export function PreSaleBanner({
  dataFinal,
  titulo = "PRÉ-VENDA: GTA VI",
  subtitulo = "LANÇAMENTO EM",
  imagem_fundo,
  imagem_capa,
}: PreSaleBannerProps) {
  const backgroundStyle = imagem_fundo
    ? {
        backgroundImage: `url(${imagem_fundo})`,
        backgroundSize: "cover" as const,
        backgroundPosition: "center" as const,
        backgroundColor: "transparent",
      }
    : undefined;

  return (
    <section id="pre-venda" className="px-3 sm:px-4 md:px-6">
      <div className="pre-venda-gradient mx-auto max-w-7xl md:rounded-2xl">
        <div
          className="pre-venda-content relative flex min-h-[200px] flex-col items-center justify-center gap-6 overflow-hidden px-4 py-8 sm:min-h-[280px] sm:flex-row sm:justify-between sm:gap-8 sm:px-6 sm:py-10 md:min-h-[320px] md:px-8 md:py-12"
          style={backgroundStyle}
        >
          {imagem_fundo && (
            <div className="absolute inset-0 bg-zinc-950/75" aria-hidden />
          )}
          <div className="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
            {imagem_capa && (
              <div className="relative h-[180px] w-[140px] shrink-0 overflow-hidden rounded-xl border-2 border-white/10 shadow-2xl sm:h-[220px] sm:w-[168px] md:h-[260px] md:w-[200px]">
                <Image
                  src={imagem_capa}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 140px, (max-width: 768px) 168px, 200px"
                  unoptimized={imagem_capa.startsWith("http") && !imagem_capa.includes("supabase")}
                />
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col items-center gap-4 sm:items-start sm:gap-5">
              <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-left sm:text-3xl md:text-4xl lg:text-5xl">
                {titulo}
              </h2>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
                <span className="font-mono text-base font-bold uppercase tracking-[0.25em] text-emerald-400/95 sm:text-lg md:text-xl">
                  {subtitulo}
                </span>
                <div className="drop-shadow-[0_4px_14px_rgba(0,0,0,0.4)]">
                  <CountdownTimer dataFinal={dataFinal} variant="boxesLarge" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
