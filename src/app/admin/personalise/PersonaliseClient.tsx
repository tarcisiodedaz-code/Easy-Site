"use client";

import { useState, useRef } from "react";
import { salvarPersonalise } from "./actions";

type Props = {
  logoUrl: string | null;
  faviconUrl: string | null;
  iconePagBankUrl: string | null;
  iconePixUrl: string | null;
  iconePS4Url: string | null;
  iconePS5Url: string | null;
};

const LOGO_DIMENSOES = "320 × 64 px";
const FAVICON_DIMENSOES = "32 × 32 px (ICO ou PNG)";
const ICONE_PAGAMENTO_DIMENSOES = "64 × 64 px (PNG com fundo transparente)";
const ICONE_CONSOLE_DIMENSOES = "64 × 64 px (PNG com fundo transparente)";

export function PersonaliseClient({ logoUrl, faviconUrl, iconePagBankUrl, iconePixUrl, iconePS4Url, iconePS5Url }: Props) {
  const [logo, setLogo] = useState<string | null>(logoUrl);
  const [favicon, setFavicon] = useState<string | null>(faviconUrl);
  const [iconePagBank, setIconePagBank] = useState<string | null>(iconePagBankUrl);
  const [iconePix, setIconePix] = useState<string | null>(iconePixUrl);
  const [iconePS4, setIconePS4] = useState<string | null>(iconePS4Url);
  const [iconePS5, setIconePS5] = useState<string | null>(iconePS5Url);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const pagbankInputRef = useRef<HTMLInputElement>(null);
  const pixInputRef = useRef<HTMLInputElement>(null);
  const ps4InputRef = useRef<HTMLInputElement>(null);
  const ps5InputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File, folder: string): Promise<string | null> {
    const formData = new FormData();
    formData.set("file", file);
    formData.set("folder", folder);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || "Falha no upload");
    return data.url ?? null;
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg(null);
    try {
      const url = await uploadFile(file, "logo");
      if (url) setLogo(url);
    } catch (err) {
      setMsg({ tipo: "erro", texto: err instanceof Error ? err.message : "Erro no upload" });
    }
  }

  async function handleFaviconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg(null);
    try {
      const url = await uploadFile(file, "favicon");
      if (url) setFavicon(url);
    } catch (err) {
      setMsg({ tipo: "erro", texto: err instanceof Error ? err.message : "Erro no upload" });
    }
  }

  async function handlePagBankChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg(null);
    try {
      const url = await uploadFile(file, "icones-pagamento");
      if (url) setIconePagBank(url);
    } catch (err) {
      setMsg({ tipo: "erro", texto: err instanceof Error ? err.message : "Erro no upload" });
    }
  }

  async function handlePixChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg(null);
    try {
      const url = await uploadFile(file, "icones-pagamento");
      if (url) setIconePix(url);
    } catch (err) {
      setMsg({ tipo: "erro", texto: err instanceof Error ? err.message : "Erro no upload" });
    }
  }

  async function handlePS4Change(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg(null);
    try {
      const url = await uploadFile(file, "icones-console");
      if (url) setIconePS4(url);
    } catch (err) {
      setMsg({ tipo: "erro", texto: err instanceof Error ? err.message : "Erro no upload" });
    }
  }

  async function handlePS5Change(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg(null);
    try {
      const url = await uploadFile(file, "icones-console");
      if (url) setIconePS5(url);
    } catch (err) {
      setMsg({ tipo: "erro", texto: err instanceof Error ? err.message : "Erro no upload" });
    }
  }

  async function handleSalvar() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await salvarPersonalise(logo, favicon, iconePagBank, iconePix, iconePS4, iconePS5);
      if (res.ok) {
        setMsg({ tipo: "ok", texto: "Configuração salva. Atualize a loja para ver as alterações." });
      } else {
        setMsg({ tipo: "erro", texto: res.erro || "Erro ao salvar" });
      }
    } catch {
      setMsg({ tipo: "erro", texto: "Erro ao salvar" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div
          className={`rounded-lg border px-4 py-3 ${
            msg.tipo === "ok"
              ? "border-emerald-800 bg-emerald-950/30 text-emerald-200"
              : "border-red-800 bg-red-950/30 text-red-200"
          }`}
        >
          {msg.texto}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800/50 px-6 pb-6 pt-4">
        <p className="mb-6 text-sm text-zinc-400">
          Edite a logo da marca no header e o ícone da aba do navegador.
        </p>

        <div className="mb-8">
          <h3 className="text-base font-medium text-white">Logo da marca</h3>
          <p className="mt-0.5 text-sm text-zinc-400">
            Imagem exibida no header da loja. Use a dimensão abaixo para a logo preencher bem o espaço reservado.
          </p>
          <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-950/30 px-4 py-3">
            <p className="text-sm font-medium text-amber-200">Dimensões recomendadas para a logo da marca</p>
            <p className="mt-1 text-lg font-bold text-amber-100">{LOGO_DIMENSOES}</p>
            <p className="mt-1 text-xs text-amber-200/90">
              Corresponde ao espaço da logo no header (largura máx. 320px, altura 64px). Use PNG ou SVG; para telas retina, 640 × 128 px. Fundo transparente (PNG) se a logo tiver formato irregular.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {logo && (
              <div className="flex h-16 items-center rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-2">
                <img src={logo} alt="Logo atual" className="h-full w-auto max-w-[280px] object-contain object-left" />
                <button
                  type="button"
                  onClick={() => setLogo(null)}
                  className="ml-2 rounded bg-red-600/80 p-1 text-white hover:bg-red-600"
                  title="Remover logo"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/svg+xml,image/png,image/jpeg,image/webp"
              onChange={handleLogoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
            >
              {logo ? "Trocar logo" : "Enviar logo"}
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-base font-medium text-white">Ícone da aba (favicon)</h3>
          <p className="mt-0.5 text-sm text-zinc-400">
            Ícone exibido na aba do navegador, ao lado do título da loja.
          </p>
          <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-950/30 px-4 py-3">
            <p className="text-sm font-medium text-amber-200">Formato e dimensões</p>
            <p className="mt-1 text-lg font-bold text-amber-100">{FAVICON_DIMENSOES}</p>
            <p className="mt-1 text-xs text-amber-200/90">
              Recomendamos enviar um arquivo <strong>.ico</strong> para compatibilidade em todos os navegadores. Também aceitamos PNG 32×32 px.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {favicon && (
              <div className="relative flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-900">
                <img src={favicon} alt="Favicon" className="h-8 w-8 object-contain" />
                <button
                  type="button"
                  onClick={() => setFavicon(null)}
                  className="absolute -right-1 -top-1 rounded-full bg-red-600/90 p-0.5 text-white hover:bg-red-600"
                  title="Remover favicon"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <input
              ref={faviconInputRef}
              type="file"
              accept=".ico,image/x-icon,image/png,image/vnd.microsoft.icon"
              onChange={handleFaviconChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => faviconInputRef.current?.click()}
              className="rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
            >
              {favicon ? "Trocar ícone" : "Enviar favicon"}
            </button>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-700 pt-6">
          <button
            type="button"
            onClick={handleSalvar}
            disabled={saving}
            className="rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </div>

      {/* Seção: Ícones de Pagamento */}
      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800/50 px-6 pb-6 pt-4">
        <h2 className="mb-2 text-lg font-semibold text-white">Ícones de Pagamento</h2>
        <p className="mb-6 text-sm text-zinc-400">
          Ícones exibidos na página de produto, ao lado dos métodos de pagamento.
        </p>

        {/* Ícone PagBank */}
        <div className="mb-8">
          <h3 className="text-base font-medium text-white">Ícone PagBank</h3>
          <p className="mt-0.5 text-sm text-zinc-400">Exibido ao lado de &quot;Cartão via PagBank&quot; na página de produto.</p>
          <div className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-4 py-3">
            <p className="text-sm font-medium text-emerald-200">Dimensões recomendadas</p>
            <p className="mt-1 text-lg font-bold text-emerald-100">{ICONE_PAGAMENTO_DIMENSOES}</p>
            <p className="mt-1 text-xs text-emerald-200/90">PNG com fundo transparente funciona melhor.</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {iconePagBank ? (
              <div className="relative flex h-16 w-16 items-center justify-center rounded-lg border border-zinc-600 bg-emerald-500/20">
                <img src={iconePagBank} alt="Ícone PagBank" className="h-10 w-10 object-contain" />
                <button
                  type="button"
                  onClick={() => setIconePagBank(null)}
                  className="absolute -right-1 -top-1 rounded-full bg-red-600/90 p-0.5 text-white hover:bg-red-600"
                  title="Remover ícone"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-zinc-600 bg-emerald-500/10">
                <span className="text-xs text-zinc-500">64×64</span>
              </div>
            )}
            <input
              ref={pagbankInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/webp"
              onChange={handlePagBankChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => pagbankInputRef.current?.click()}
              className="rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
            >
              {iconePagBank ? "Trocar ícone" : "Enviar ícone"}
            </button>
          </div>
        </div>

        {/* Ícone Pix */}
        <div>
          <h3 className="text-base font-medium text-white">Ícone Pix</h3>
          <p className="mt-0.5 text-sm text-zinc-400">
            Exibido ao lado de &quot;Pague com Pix&quot; na página de produto.
          </p>
          <div className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-4 py-3">
            <p className="text-sm font-medium text-emerald-200">Dimensões recomendadas</p>
            <p className="mt-1 text-lg font-bold text-emerald-100">{ICONE_PAGAMENTO_DIMENSOES}</p>
            <p className="mt-1 text-xs text-emerald-200/90">
              Use o logo oficial do Pix. PNG com fundo transparente funciona melhor.
              Baixe em: <a href="https://www.bcb.gov.br/estabilidadefinanceira/pix" target="_blank" rel="noopener noreferrer" className="underline">Manual da Marca Pix (BCB)</a>
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {iconePix ? (
              <div className="relative flex h-16 w-16 items-center justify-center rounded-lg border border-zinc-600 bg-[#32BCAD]">
                <img src={iconePix} alt="Ícone Pix" className="h-10 w-10 object-contain" />
                <button
                  type="button"
                  onClick={() => setIconePix(null)}
                  className="absolute -right-1 -top-1 rounded-full bg-red-600/90 p-0.5 text-white hover:bg-red-600"
                  title="Remover ícone"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-zinc-600 bg-[#32BCAD]/20">
                <span className="text-xs text-zinc-500">64×64</span>
              </div>
            )}
            <input
              ref={pixInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/webp"
              onChange={handlePixChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => pixInputRef.current?.click()}
              className="rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
            >
              {iconePix ? "Trocar ícone" : "Enviar ícone"}
            </button>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-700 pt-6">
          <button
            type="button"
            onClick={handleSalvar}
            disabled={saving}
            className="rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </div>

      {/* Seção: Ícones de Console */}
      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800/50 px-6 pb-6 pt-4">
        <h2 className="mb-2 text-lg font-semibold text-white">Ícones de Console</h2>
        <p className="mb-6 text-sm text-zinc-400">
          Ícones exibidos no seletor de console na página de produto (PS4/PS5).
        </p>

        {/* Ícone PS4 */}
        <div className="mb-8">
          <h3 className="text-base font-medium text-white">Ícone PlayStation 4</h3>
          <p className="mt-0.5 text-sm text-zinc-400">
            Exibido no card de seleção do PS4 na página de produto.
          </p>
          <div className="mt-3 rounded-lg border border-zinc-500/40 bg-zinc-900/30 px-4 py-3">
            <p className="text-sm font-medium text-zinc-200">Dimensões recomendadas</p>
            <p className="mt-1 text-lg font-bold text-zinc-100">{ICONE_CONSOLE_DIMENSOES}</p>
            <p className="mt-1 text-xs text-zinc-300/90">
              Use o logo oficial do PlayStation 4. PNG com fundo transparente funciona melhor.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {iconePS4 ? (
              <div className="relative flex h-16 w-16 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-900">
                <img src={iconePS4} alt="Ícone PS4" className="h-10 w-10 object-contain" />
                <button
                  type="button"
                  onClick={() => setIconePS4(null)}
                  className="absolute -right-1 -top-1 rounded-full bg-red-600/90 p-0.5 text-white hover:bg-red-600"
                  title="Remover ícone"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-zinc-600 bg-zinc-900/50">
                <span className="text-xs text-zinc-500">64×64</span>
              </div>
            )}
            <input
              ref={ps4InputRef}
              type="file"
              accept="image/png,image/svg+xml,image/webp"
              onChange={handlePS4Change}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => ps4InputRef.current?.click()}
              className="rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
            >
              {iconePS4 ? "Trocar ícone" : "Enviar ícone"}
            </button>
          </div>
        </div>

        {/* Ícone PS5 */}
        <div>
          <h3 className="text-base font-medium text-white">Ícone PlayStation 5</h3>
          <p className="mt-0.5 text-sm text-zinc-400">
            Exibido no card de seleção do PS5 na página de produto.
          </p>
          <div className="mt-3 rounded-lg border border-zinc-500/40 bg-zinc-900/30 px-4 py-3">
            <p className="text-sm font-medium text-zinc-200">Dimensões recomendadas</p>
            <p className="mt-1 text-lg font-bold text-zinc-100">{ICONE_CONSOLE_DIMENSOES}</p>
            <p className="mt-1 text-xs text-zinc-300/90">
              Use o logo oficial do PlayStation 5. PNG com fundo transparente funciona melhor.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {iconePS5 ? (
              <div className="relative flex h-16 w-16 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-900">
                <img src={iconePS5} alt="Ícone PS5" className="h-10 w-10 object-contain" />
                <button
                  type="button"
                  onClick={() => setIconePS5(null)}
                  className="absolute -right-1 -top-1 rounded-full bg-red-600/90 p-0.5 text-white hover:bg-red-600"
                  title="Remover ícone"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-zinc-600 bg-zinc-900/50">
                <span className="text-xs text-zinc-500">64×64</span>
              </div>
            )}
            <input
              ref={ps5InputRef}
              type="file"
              accept="image/png,image/svg+xml,image/webp"
              onChange={handlePS5Change}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => ps5InputRef.current?.click()}
              className="rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
            >
              {iconePS5 ? "Trocar ícone" : "Enviar ícone"}
            </button>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-700 pt-6">
          <button
            type="button"
            onClick={handleSalvar}
            disabled={saving}
            className="rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
