import Link from "next/link";

const WHATSAPP_NUMERO = "5579999204322";
const TELEFONE = "(79) 99920-4322";
const EMAIL = "egdigitalbr@gmail.com";

export function StoreFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Easy Games
            </h3>
            <p className="mt-3 text-sm text-zinc-400">
              Loja 100% segura. Atendimento rápido por WhatsApp.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Contato
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-[var(--accent)]"
                >
                  WhatsApp: {TELEFONE}
                </a>
              </li>
              <li>
                <a href={`tel:${TELEFONE.replace(/\D/g, "")}`} className="transition-colors hover:text-[var(--accent)]">
                  Tel: {TELEFONE}
                </a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`} className="transition-colors hover:text-[var(--accent)]">
                  {EMAIL}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Páginas
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/categorias" className="transition-colors hover:text-[var(--accent)]">
                  Categorias
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="transition-colors hover:text-[var(--accent)]">
                  Sobre a loja
                </Link>
              </li>
              <li>
                <Link href="/termos" className="transition-colors hover:text-[var(--accent)]">
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="transition-colors hover:text-[var(--accent)]">
                  Política de privacidade
                </Link>
              </li>
              <li>
                <Link href="/trocas" className="transition-colors hover:text-[var(--accent)]">
                  Política de troca/devolução
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Pagamento
            </h3>
            <p className="mt-3 text-sm text-zinc-400">
              Pague com <strong className="text-zinc-300">Pix</strong> e receba na hora.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 sm:flex-row">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Easy Games. Todos os direitos reservados.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMERO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Fale Conosco
          </a>
        </div>
      </div>
    </footer>
  );
}
