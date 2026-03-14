import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";
import { UtilityBar } from "@/components/UtilityBar";
import { BannerDivisor } from "@/components/BannerDivisor";
import { HeroCarousel } from "@/components/HeroCarousel";
import { PreSaleBanner } from "@/components/PreSaleBanner";
import { VitrineMaisVendidos } from "@/components/VitrineMaisVendidos";
import { VitrineLancamentos } from "@/components/VitrineLancamentos";
import { VitrineDestaques } from "@/components/VitrineDestaques";
import { getLojaConfig } from "@/lib/loja-config";
import { getConfigHome } from "@/lib/config-home";
import { getProdutosMaisVendidos, getProdutosLancamentos, getProdutosDestaques } from "@/lib/vitrine";
import { getCategoriasProdutoParaMenu } from "@/lib/produtos-completo";

export default async function Home() {
  const [utilityBar, carousel, preSale, configHome, logoMarca, categoriasMenu, bannerDivisor] = await Promise.all([
    getLojaConfig("utility_bar"),
    getLojaConfig("carousel"),
    getLojaConfig("pre_sale"),
    getConfigHome(),
    getLojaConfig("logo_marca"),
    getCategoriasProdutoParaMenu(),
    getLojaConfig("banner_divisor"),
  ]);

  const precisaMaisVendidos = configHome.ordem_secoes.includes("mais_vendidos");
  const precisaLancamentos = configHome.ordem_secoes.includes("lancamentos");
  const precisaDestaques = configHome.ordem_secoes.includes("destaques");

  const [maisVendidos, lancamentos, destaque] = await Promise.all([
    precisaMaisVendidos ? getProdutosMaisVendidos(8) : [],
    precisaLancamentos ? getProdutosLancamentos(8) : [],
    precisaDestaques ? getProdutosDestaques(8) : [],
  ]);

  const secoes = {
    lancamentos: <VitrineLancamentos produtos={lancamentos} />,
    mais_vendidos: <VitrineMaisVendidos produtos={maisVendidos} />,
    destaque: <VitrineDestaques produtos={destaque} />,
  } as const;
  const getSecao = (key: string) =>
    key === "destaques" ? secoes.destaque : secoes[key as keyof typeof secoes];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <StoreHeader logoUrl={logoMarca?.url ?? null} categoriasMenu={categoriasMenu} />

      <main className="pt-[130px] sm:pt-[140px] md:pt-[150px]">
        <section className="mb-10 md:mb-14">
          <HeroCarousel slides={carousel} />
        </section>
        <section className="mb-10 md:mb-14">
          {bannerDivisor?.ativo ? (
            <BannerDivisor config={bannerDivisor} />
          ) : (
            <UtilityBar items={utilityBar} showLogin={false} />
          )}
        </section>
        <section className="mb-12 md:mb-16">
          <PreSaleBanner
            dataFinal={preSale.dataFinal}
            titulo={preSale.titulo}
            subtitulo={preSale.subtitulo}
            imagem_fundo={preSale.imagem_fundo}
            imagem_capa={preSale.imagem_capa}
          />
        </section>

        <div className="mx-auto w-full max-w-7xl">
          {configHome.ordem_secoes.map((key) => (
            <div key={key}>{getSecao(key) ?? null}</div>
          ))}
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}
