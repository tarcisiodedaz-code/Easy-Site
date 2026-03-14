"use client";

import Image from "next/image";
import type { BannerDivisorConfig } from "@/types/loja-config";
import { BannerDivisorDefaultIcon } from "./BannerDivisorDefaultIcon";

type Props = {
  config: BannerDivisorConfig;
};

export function BannerDivisor({ config }: Props) {
  if (!config?.ativo) return null;

  const itens = config.itens ?? [
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
  ];

  const tituloPrincipal = config.titulo_principal || "GARANTIA EASY GAMES: DO PRESENTE PARA O FUTURO.";

  return (
    <section className="relative overflow-hidden">
      {/* Fundo com gradiente */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900" />
      
      {/* Imagem de fundo opcional */}
      {config.imagem_fundo_url && (
        <div className="absolute inset-0 opacity-20">
          <Image
            src={config.imagem_fundo_url}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* Borda superior com gradiente */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Título principal */}
        <h2 className="mb-6 text-center text-sm font-bold tracking-wider text-emerald-400 sm:text-base md:text-lg">
          {tituloPrincipal}
        </h2>

        {/* Grid de itens */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {itens.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 backdrop-blur-sm transition-all hover:border-zinc-600 hover:bg-zinc-800/70"
            >
              {/* Ícone */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 shadow-lg">
                {item.icone_url ? (
                  <Image
                    src={item.icone_url}
                    alt=""
                    width={40}
                    height={40}
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <BannerDivisorDefaultIcon index={index} />
                )}
              </div>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white sm:text-base">
                  {item.titulo}
                </h3>
                <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                  {item.descricao}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Borda inferior com gradiente */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500" />
    </section>
  );
}
