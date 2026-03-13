"use client";

import { useState } from "react";
import { saveBannerCarousel, saveBannerPreSale } from "./actions";
import { UploadPreview } from "./UploadPreview";
import type { CarouselSlide, PreSaleConfig } from "@/types/loja-config";

type Props = {
  carousel: CarouselSlide[];
  preSale: PreSaleConfig;
};

export function EditorBanners({ carousel: initialCarousel, preSale: initialPreSale }: Props) {
  const [status, setStatus] = useState<{ ok?: boolean; msg?: string }>({});
  const [carousel, setCarousel] = useState<CarouselSlide[]>(
    initialCarousel?.length ? initialCarousel : [{ image: "", title: "", link: "#" }]
  );
  const [preSale, setPreSale] = useState<PreSaleConfig>({
    titulo: initialPreSale?.titulo ?? "PRÉ-VENDA: GTA VI",
    subtitulo: initialPreSale?.subtitulo ?? "LANÇAMENTO EM",
    dataFinal: initialPreSale?.dataFinal ?? "2026-09-17T00:00:00",
    imagem_fundo: initialPreSale?.imagem_fundo,
    imagem_capa: initialPreSale?.imagem_capa,
  });

  async function handleSaveCarousel() {
    setStatus({});
    const filtered = carousel.filter((s) => s.image?.trim());
    const res = await saveBannerCarousel(filtered.length ? filtered : carousel);
    setStatus({ ok: res.ok, msg: res.ok ? "Banner principal salvo." : res.error });
  }

  async function handleSavePreSale() {
    setStatus({});
    const res = await saveBannerPreSale(preSale);
    setStatus({ ok: res.ok, msg: res.ok ? "Banner de contagem salvo." : res.error });
  }

  return (
    <div className="space-y-10">
      {status.msg && (
        <p
          className={`rounded-lg border px-4 py-2 text-sm ${
            status.ok ? "border-green-600 bg-green-900/30 text-green-300" : "border-red-600 bg-red-900/30 text-red-300"
          }`}
        >
          {status.msg}
        </p>
      )}

      {/* Banner principal (carrossel) */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-2 text-lg font-semibold text-white">Banner principal (carrossel)</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Envie as imagens do carrossel (não use URL). Use a dimensão indicada para cada tipo.
        </p>
        <div className="space-y-4">
          {carousel.map((slide, i) => (
            <div key={i} className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
              <div className="mb-3 flex flex-wrap gap-4">
                <div className="w-full min-w-0 sm:w-56">
                  <UploadPreview
                    value={slide.image}
                    onChange={(url) => {
                      const next = [...carousel];
                      next[i] = { ...next[i], image: url || "" };
                      setCarousel(next);
                    }}
                    folder="banners"
                    label="Imagem do slide"
                    recommendedSize="1920×820px (proporção do carrossel)"
                    previewSize="large"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => {
                      const next = [...carousel];
                      next[i] = { ...next[i], title: e.target.value };
                      setCarousel(next);
                    }}
                    className="w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white"
                    placeholder="Título"
                  />
                  <input
                    type="text"
                    value={slide.link}
                    onChange={(e) => {
                      const next = [...carousel];
                      next[i] = { ...next[i], link: e.target.value };
                      setCarousel(next);
                    }}
                    className="w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white"
                    placeholder="Link de destino (# ou URL)"
                  />
                </div>
              </div>
              {carousel.length > 1 && (
                <button
                  type="button"
                  onClick={() => setCarousel(carousel.filter((_, j) => j !== i))}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Remover slide
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCarousel([...carousel, { image: "", title: "", link: "#" }])}
          className="mt-2 text-sm text-emerald-400 hover:underline"
        >
          + Adicionar slide
        </button>
        <button
          type="button"
          onClick={handleSaveCarousel}
          className="ml-4 mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Salvar carrossel
        </button>
      </section>

      {/* Banner de contagem (pré-venda) */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-2 text-lg font-semibold text-white">Banner de contagem (pré-venda)</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Capa do jogo (upload), imagem de fundo opcional e data do lançamento. O relógio do site usa essa data.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <UploadPreview
              value={preSale.imagem_capa}
              onChange={(url) => setPreSale({ ...preSale, imagem_capa: url || undefined })}
              folder="banners"
              label="Capa do jogo (destaque no banner)"
              recommendedSize="320 × 420 px"
              previewSize="large"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Use exatamente 320×420 px para a capa ficar nítida. Proporção de capa de jogo.
            </p>
          </div>
          <div className="sm:col-span-2">
            <UploadPreview
              value={preSale.imagem_fundo}
              onChange={(url) => setPreSale({ ...preSale, imagem_fundo: url || undefined })}
              folder="banners"
              label="Imagem de fundo do banner (opcional)"
              recommendedSize="1920×400px"
              previewSize="large"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Título</label>
            <input
              type="text"
              value={preSale.titulo}
              onChange={(e) => setPreSale({ ...preSale, titulo: e.target.value })}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white"
              placeholder="PRÉ-VENDA: GTA VI"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Subtítulo</label>
            <input
              type="text"
              value={preSale.subtitulo}
              onChange={(e) => setPreSale({ ...preSale, subtitulo: e.target.value })}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white"
              placeholder="LANÇAMENTO EM"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-zinc-400">Data e hora do lançamento (contagem regressiva)</label>
            <input
              type="datetime-local"
              value={preSale.dataFinal ? preSale.dataFinal.slice(0, 16) : ""}
              onChange={(e) =>
                setPreSale({
                  ...preSale,
                  dataFinal: e.target.value ? new Date(e.target.value).toISOString() : preSale.dataFinal,
                })
              }
              className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleSavePreSale}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Salvar banner de contagem
        </button>
      </section>
    </div>
  );
}
