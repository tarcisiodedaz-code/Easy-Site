import Link from "next/link";

const itens = [
  {
    titulo: "Pagamento seguro",
    descricao: "Pix, cartão ou parcelado. Ambiente protegido.",
    icon: "🔒",
  },
  {
    titulo: "Entrega rápida",
    descricao: "Código ou conta na hora, conforme o produto.",
    icon: "⚡",
  },
  {
    titulo: "Suporte no WhatsApp",
    descricao: "Dúvidas? Resposta rápida pela nossa equipe.",
    icon: "💬",
  },
  {
    titulo: "Preço justo",
    descricao: "Ofertas selecionadas e condições especiais.",
    icon: "💰",
  },
];

export function PorQueComprar() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Por que comprar na Easy Games?
        </h2>
        <p className="mt-2 text-zinc-400">
          Segurança, rapidez e atendimento que fazem a diferença
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {itens.map((item) => (
          <div
            key={item.titulo}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center"
          >
            <span className="text-3xl" aria-hidden>
              {item.icon}
            </span>
            <h3 className="mt-3 font-semibold text-white">{item.titulo}</h3>
            <p className="mt-1 text-sm text-zinc-400">{item.descricao}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center">
        <Link
          href="/categorias/ofertas"
          className="inline-flex items-center rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          Ver ofertas
        </Link>
      </p>
    </section>
  );
}
