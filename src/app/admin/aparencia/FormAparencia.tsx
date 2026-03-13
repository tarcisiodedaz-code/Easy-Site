"use client";

import { useState } from "react";
import { saveAparenciaAction } from "./actions";
import { UploadPreview } from "@/app/admin/customizacao/UploadPreview";
import type {
  UtilityBarItem,
  CarouselSlide,
  PreSaleConfig,
  NavPlatformItem,
} from "@/types/loja-config";

type Config = {
  utility_bar?: UtilityBarItem[];
  carousel?: CarouselSlide[];
  pre_sale?: PreSaleConfig;
  nav_platforms?: NavPlatformItem[];
};

export function FormAparencia({ config }: { config: Config }) {
  const [status, setStatus] = useState<{ ok?: boolean; msg?: string }>({});
  const [utilityBar, setUtilityBar] = useState<UtilityBarItem[]>(
    config.utility_bar ?? [
      { icon: "lock", label: "LOJA SEGURA" },
      { icon: "fast", label: "ENVIO IMEDIATO" },
      { icon: "controller", label: "JOGOS DIGITAIS" },
    ]
  );
  const [carousel, setCarousel] = useState<CarouselSlide[]>(
    config.carousel ?? [
      { image: "", title: "", link: "#" },
    ]
  );
  const [preSale, setPreSale] = useState<PreSaleConfig>(
    config.pre_sale ?? {
      titulo: "PRÉ-VENDA: GTA VI",
      subtitulo: "LANÇAMENTO EM",
      dataFinal: "2026-09-17T00:00:00",
    }
  );

  async function handleSaveUtilityBar() {
    setStatus({});
    const res = await saveAparenciaAction("utility_bar", utilityBar);
    setStatus({ ok: res.ok, msg: res.ok ? "Barra de utilidade salva." : res.error });
  }

  async function handleSaveCarousel() {
    setStatus({});
    const filtered = carousel.filter((s) => s.image?.trim());
    const res = await saveAparenciaAction("carousel", filtered.length ? filtered : carousel);
    setStatus({ ok: res.ok, msg: res.ok ? "Carrossel salvo." : res.error });
  }

  async function handleSavePreSale() {
    setStatus({});
    const res = await saveAparenciaAction("pre_sale", preSale);
    setStatus({ ok: res.ok, msg: res.ok ? "Pré-venda salva." : res.error });
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

      {/* Barra de utilidade */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Barra superior (LOJA SEGURA, ENVIO IMEDIATO…)</h2>
        <div className="space-y-3">
          {utilityBar.map((item, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={item.icon}
                onChange={(e) => {
                  const next = [...utilityBar];
                  next[i] = { ...next[i], icon: e.target.value };
                  setUtilityBar(next);
                }}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white"
              >
                <option value="lock">Cadeado</option>
                <option value="fast">Rápido</option>
                <option value="controller">Controle</option>
              </select>
              <input
                type="text"
                value={item.label}
                onChange={(e) => {
                  const next = [...utilityBar];
                  next[i] = { ...next[i], label: e.target.value };
                  setUtilityBar(next);
                }}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white"
                placeholder="Label"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleSaveUtilityBar}
          className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          Salvar barra de utilidade
        </button>
      </section>

      {/* Carrossel */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Carrossel da home (imagens em destaque)</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Envie as imagens (não use URL). Use a dimensão indicada para encaixar certinho no carrossel.
        </p>
        <div className="space-y-4">
          {carousel.map((slide, i) => (
            <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
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
                    className="w-full rounded border border-[var(--border)] bg-zinc-900 px-3 py-2 text-sm text-white"
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
                    className="w-full rounded border border-[var(--border)] bg-zinc-900 px-3 py-2 text-sm text-white"
                    placeholder="Link de destino (# ou URL)"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCarousel(carousel.filter((_, j) => j !== i))}
                className="mt-2 text-sm text-red-400 hover:text-red-300"
              >
                Remover slide
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCarousel([...carousel, { image: "", title: "", link: "#" }])}
          className="mt-2 text-sm text-[var(--accent)] hover:underline"
        >
          + Adicionar slide
        </button>
        <button
          type="button"
          onClick={handleSaveCarousel}
          className="ml-4 mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          Salvar carrossel
        </button>
      </section>

      {/* Pré-venda */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Banner de pré-venda</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Envie a imagem de fundo (não use URL). Use a dimensão indicada para encaixar certinho.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <UploadPreview
              value={preSale.imagem_fundo}
              onChange={(url) => setPreSale({ ...preSale, imagem_fundo: url || undefined })}
              folder="banners"
              label="Imagem de fundo do banner"
              recommendedSize="1920×300px"
              previewSize="large"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Título</label>
            <input
              type="text"
              value={preSale.titulo}
              onChange={(e) => setPreSale({ ...preSale, titulo: e.target.value })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-white"
              placeholder="PRÉ-VENDA: GTA VI"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Subtítulo (ex: LANÇAMENTO EM)</label>
            <input
              type="text"
              value={preSale.subtitulo}
              onChange={(e) => setPreSale({ ...preSale, subtitulo: e.target.value })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-zinc-400">Data/hora do lançamento (countdown)</label>
            <input
              type="datetime-local"
              value={preSale.dataFinal ? preSale.dataFinal.slice(0, 16) : ""}
              onChange={(e) => setPreSale({ ...preSale, dataFinal: e.target.value ? new Date(e.target.value).toISOString() : preSale.dataFinal })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-white"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleSavePreSale}
          className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          Salvar pré-venda
        </button>
      </section>
    </div>
  );
}
