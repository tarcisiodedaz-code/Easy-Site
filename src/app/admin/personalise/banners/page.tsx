import { getLojaConfig } from "@/lib/loja-config";
import { EditorBanners } from "@/app/admin/customizacao/EditorBanners";

export default async function AdminPersonaliseBannersPage() {
  const [carousel, preSale] = await Promise.all([
    getLojaConfig("carousel"),
    getLojaConfig("pre_sale"),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Banners
        </h1>
        <p className="mt-2 text-zinc-400">
          Personalize o banner principal (carrossel) e o banner com contagem regressiva. Use as dimensões indicadas para cada imagem.
        </p>
      </header>

      <EditorBanners carousel={carousel} preSale={preSale} />
    </div>
  );
}
