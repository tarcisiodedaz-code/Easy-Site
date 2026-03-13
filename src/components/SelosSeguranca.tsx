export function SelosSeguranca() {
  const selos = [
    { label: "Pagamento seguro", icon: "🔒" },
    { label: "Entrega rápida", icon: "⚡" },
    { label: "Suporte via WhatsApp", icon: "💬" },
    { label: "Site seguro", icon: "🛡️" },
  ];

  return (
    <section className="border-t border-[var(--border)] bg-[var(--card)]/50 py-12">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-8 px-4">
        {selos.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)]/80 px-5 py-3"
          >
            <span className="text-2xl" aria-hidden>
              {s.icon}
            </span>
            <span className="text-sm font-medium text-zinc-300">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
