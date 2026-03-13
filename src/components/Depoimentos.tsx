export function Depoimentos() {
  const depoimentos = [
    {
      texto: "Compra rápida e sem stress. Recebi o código na hora.",
      autor: "Cliente verificado",
    },
    {
      texto: "Preço bom e atendimento no WhatsApp muito bom.",
      autor: "Cliente verificado",
    },
    {
      texto: "Já comprei mais de uma vez. Recomendo.",
      autor: "Cliente verificado",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          O que nossos clientes dizem
        </h2>
        <p className="mt-2 text-zinc-400">
          Prova social de quem já comprou na Easy Games
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {depoimentos.map((d, i) => (
          <blockquote
            key={i}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
          >
            <p className="text-zinc-300">&ldquo;{d.texto}&rdquo;</p>
            <footer className="mt-4 text-sm text-zinc-500">— {d.autor}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
