import Link from "next/link";
import { getPaginasAtivas } from "@/lib/paginas";

const WHATSAPP_NUMERO = "5579999204322";
const TELEFONE = "(79) 99920-4322";
const EMAIL = "egdigitalbr@gmail.com";

export async function StoreFooter() {
  const paginas = await getPaginasAtivas();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Coluna 1 - Easy Games */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
              <span className="text-lg">🎮</span> Easy Games
            </h3>
            <p className="mt-4 text-sm text-zinc-400">
              Loja especializada em jogos digitais para PS4 e PS5.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✔</span>
                Mais de 10 anos de experiência
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✔</span>
                Entrega rápida
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✔</span>
                Suporte rápido pelo WhatsApp
              </li>
            </ul>
          </div>

          {/* Coluna 2 - Institucional */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
              <span className="text-lg">📄</span> Institucional
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              {paginas.length > 0 ? (
                paginas.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/pagina/${p.slug}`}
                      className="transition-colors hover:text-[var(--accent)]"
                    >
                      {p.titulo}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link href="/pagina/produto-digital" className="transition-colors hover:text-[var(--accent)]">
                      Produto Digital
                    </Link>
                  </li>
                  <li>
                    <Link href="/pagina/termos-de-uso" className="transition-colors hover:text-[var(--accent)]">
                      Termos de Uso
                    </Link>
                  </li>
                  <li>
                    <Link href="/pagina/politica-de-privacidade" className="transition-colors hover:text-[var(--accent)]">
                      Política de Privacidade
                    </Link>
                  </li>
                  <li>
                    <Link href="/pagina/troca-devolucao" className="transition-colors hover:text-[var(--accent)]">
                      Troca / Devolução
                    </Link>
                  </li>
                  <li>
                    <Link href="/pagina/sobre-a-loja" className="transition-colors hover:text-[var(--accent)]">
                      Sobre a Loja
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Coluna 3 - Suporte */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
              <span className="text-lg">📞</span> Suporte
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-400">
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors hover:text-[var(--accent)]"
                >
                  <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp: {TELEFONE}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${EMAIL}`}
                  className="flex items-center gap-2 transition-colors hover:text-[var(--accent)]"
                >
                  <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {EMAIL}
                </a>
              </li>
            </ul>
            <div className="mt-4 rounded-lg bg-zinc-800/50 p-3">
              <p className="text-xs font-medium text-zinc-300">Horário de atendimento:</p>
              <p className="mt-1 text-sm text-zinc-400">Segunda a Sábado</p>
              <p className="text-sm font-medium text-white">09:00 às 21:00</p>
            </div>
          </div>

          {/* Coluna 4 - Pagamentos */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
              <span className="text-lg">💳</span> Pagamentos
            </h3>
            <p className="mt-4 text-sm text-zinc-400">Aceitamos:</p>
            <ul className="mt-2 space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✔</span>
                PIX (aprovação imediata)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✔</span>
                Cartão de crédito
              </li>
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              Pagamento 100% seguro via PagBank.
            </p>
            {/* Ícones de pagamento */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {/* PIX */}
              <div className="flex h-8 items-center justify-center rounded bg-white px-2">
                <span className="text-xs font-bold text-teal-600">PIX</span>
              </div>
              {/* VISA */}
              <div className="flex h-8 items-center justify-center rounded bg-white px-2">
                <span className="text-xs font-bold text-blue-800">VISA</span>
              </div>
              {/* MASTERCARD */}
              <div className="flex h-8 items-center justify-center rounded bg-white px-2">
                <span className="text-[10px] font-bold text-orange-600">MASTER</span>
              </div>
            </div>
          </div>
        </div>

        {/* Linha inferior */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 md:flex-row">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Easy Games - Todos os direitos reservados
          </p>
          <p className="text-center text-xs text-zinc-600 md:text-right">
            PlayStation® é marca registrada da Sony.<br className="hidden md:inline" />
            <span className="md:ml-1">Este site não possui vínculo oficial com a Sony.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
