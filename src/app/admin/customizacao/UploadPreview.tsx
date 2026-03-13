"use client";

import { useState, useRef } from "react";

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  accept?: string;
  label?: string;
  /** Dimensões recomendadas para encaixar certinho no layout (ex: "1920×820px") */
  recommendedSize?: string;
  /** Preview maior (para banners) */
  previewSize?: "small" | "large";
  className?: string;
};

export function UploadPreview({
  value,
  onChange,
  folder = "outros",
  accept = "image/svg+xml,image/png,image/jpeg,image/webp",
  label = "Imagem",
  recommendedSize,
  previewSize = "small",
  className = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErro(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || "Falha no upload");
      onChange(data.url);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setLoading(false);
    }
  }

  const previewClass = previewSize === "large"
    ? "h-24 w-full min-w-[200px] max-w-sm sm:h-28"
    : "h-16 w-16 shrink-0";

  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-zinc-300">{label}</label>
      {recommendedSize && (
        <div className="mb-2 rounded-lg border border-amber-500/40 bg-amber-950/30 px-3 py-2">
          <p className="text-xs font-medium text-amber-200">
            Use imagem com esta dimensão para encaixar certinho:
          </p>
          <p className="mt-0.5 text-sm font-semibold text-amber-100">
            {recommendedSize}
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-start gap-3">
        {value && (
          <div
            className={`relative flex items-center justify-center overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 ${previewClass}`}
          >
            <img
              src={value}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-1 top-1 rounded bg-red-600/90 p-1 text-white hover:bg-red-600"
              title="Remover imagem"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading ? "Enviando…" : value ? "Trocar imagem" : "Enviar imagem"}
          </button>
        </div>
      </div>
      {erro && <p className="mt-1 text-sm text-red-400">{erro}</p>}
    </div>
  );
}
