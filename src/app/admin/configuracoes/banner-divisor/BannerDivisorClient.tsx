"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { salvarBannerDivisor } from "./actions";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { BannerDivisorItem } from "@/types/loja-config";
import { BannerDivisorDefaultIcon } from "@/components/BannerDivisorDefaultIcon";

type BannerDivisorConfigLocal = {
  ativo: boolean;
  titulo_principal: string;
  imagem_fundo_url?: string | null;
  itens: BannerDivisorItem[];
};

type Props = {
  config: BannerDivisorConfigLocal;
};

export function BannerDivisorClient({ config }: Props) {
  const [ativo, setAtivo] = useState(config.ativo);
  const [tituloPrincipal, setTituloPrincipal] = useState(config.titulo_principal);
  const [imagemFundoUrl, setImagemFundoUrl] = useState<string | null>(config.imagem_fundo_url ?? null);
  const [itens, setItens] = useState<BannerDivisorItem[]>(config.itens);
  const [salvando, setSalvando] = useState(false);
  const [uploadingFundo, setUploadingFundo] = useState(false);
  const [uploadingIcone, setUploadingIcone] = useState<number | null>(null);

  const fundoInputRef = useRef<HTMLInputElement>(null);
  const iconeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleFundoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFundo(true);
    try {
      const supabase = createBrowserClient();
      const ext = file.name.split(".").pop();
      const fileName = `banner-divisor-fundo-${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from("loja-assets")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("loja-assets")
        .getPublicUrl(data.path);

      setImagemFundoUrl(urlData.publicUrl);
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      alert("Erro ao fazer upload da imagem.");
    } finally {
      setUploadingFundo(false);
    }
  }

  async function handleIconeUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIcone(index);
    try {
      const supabase = createBrowserClient();
      const ext = file.name.split(".").pop();
      const fileName = `banner-divisor-icone-${index}-${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from("loja-assets")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("loja-assets")
        .getPublicUrl(data.path);

      const novosItens = [...itens];
      novosItens[index] = { ...novosItens[index], icone_url: urlData.publicUrl };
      setItens(novosItens);
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      alert("Erro ao fazer upload do ícone.");
    } finally {
      setUploadingIcone(null);
    }
  }

  function handleItemChange(index: number, field: "titulo" | "descricao", value: string) {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [field]: value };
    setItens(novosItens);
  }

  function handleRemoveIcone(index: number) {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], icone_url: null };
    setItens(novosItens);
  }

  async function handleSalvar() {
    setSalvando(true);
    try {
      const result = await salvarBannerDivisor({
        ativo,
        titulo_principal: tituloPrincipal,
        imagem_fundo_url: imagemFundoUrl,
        itens,
      });

      if (result.success) {
        alert("Configuração salva com sucesso!");
      } else {
        alert("Erro ao salvar: " + result.error);
      }
    } catch {
      alert("Erro ao salvar configuração.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Ativo/Inativo */}
      <div className="flex items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="h-5 w-5 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-sm font-medium text-white">
            Banner ativo
          </span>
        </label>
        <span className="text-xs text-zinc-500">
          Desmarque para ocultar o banner na página inicial
        </span>
      </div>

      {/* Título Principal */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Título Principal
        </label>
        <input
          type="text"
          value={tituloPrincipal}
          onChange={(e) => setTituloPrincipal(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="GARANTIA EASY GAMES: DO PRESENTE PARA O FUTURO."
        />
      </div>

      {/* Imagem de Fundo */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Imagem de Fundo (opcional)
        </label>
        <p className="mb-3 text-xs text-zinc-500">
          Dimensões recomendadas: 1920×200px. A imagem aparecerá com opacidade reduzida.
        </p>
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-48 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
            {imagemFundoUrl ? (
              <Image
                src={imagemFundoUrl}
                alt="Fundo"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                Sem imagem
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fundoInputRef}
              type="file"
              accept="image/*"
              onChange={handleFundoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fundoInputRef.current?.click()}
              disabled={uploadingFundo}
              className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-600 disabled:opacity-50"
            >
              {uploadingFundo ? "Enviando..." : "Enviar imagem"}
            </button>
            {imagemFundoUrl && (
              <button
                type="button"
                onClick={() => setImagemFundoUrl(null)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remover imagem
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Itens */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Blocos de Informação</h3>
        <div className="space-y-6">
          {itens.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-400">
                  Bloco {index + 1}
                </span>
              </div>

              {/* Ícone do bloco */}
              <div className="mb-4">
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Ícone (opcional - 64×64px PNG)
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-700">
                    {item.icone_url ? (
                      <Image
                        src={item.icone_url}
                        alt=""
                        width={48}
                        height={48}
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <BannerDivisorDefaultIcon index={index} />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={(el) => { iconeInputRefs.current[index] = el; }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleIconeUpload(index, e)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => iconeInputRefs.current[index]?.click()}
                      disabled={uploadingIcone === index}
                      className="rounded bg-zinc-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-500 disabled:opacity-50"
                    >
                      {uploadingIcone === index ? "..." : "Enviar"}
                    </button>
                    {item.icone_url && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIcone(index)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Título do bloco */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  Título
                </label>
                <input
                  type="text"
                  value={item.titulo}
                  onChange={(e) => handleItemChange(index, "titulo", e.target.value)}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                  placeholder="Título do bloco"
                />
              </div>

              {/* Descrição do bloco */}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  Descrição
                </label>
                <input
                  type="text"
                  value={item.descricao}
                  onChange={(e) => handleItemChange(index, "descricao", e.target.value)}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                  placeholder="Descrição do bloco"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSalvar}
          disabled={salvando}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar Configuração"}
        </button>
      </div>
    </div>
  );
}
