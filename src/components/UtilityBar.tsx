import Link from "next/link";
import type { UtilityBarItem as Item } from "@/types/loja-config";

function Icon({ name }: { name: string }) {
  const cls = "h-4 w-4 shrink-0 text-zinc-500";
  switch (name) {
    case "lock":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    case "fast":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case "controller":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      );
    default:
      return null;
  }
}

export function UtilityBar({ items, showLogin = false }: { items: Item[]; showLogin?: boolean }) {
  return (
    <div className="bg-black text-zinc-400">
      <div
        className={`mx-auto flex max-w-7xl items-center px-4 py-2.5 text-xs sm:text-sm md:px-6 lg:px-8 ${showLogin ? "justify-between" : "justify-center"}`}
      >
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              <Icon name={item.icon} />
              <span className="tracking-wide">{item.label}</span>
            </span>
          ))}
        </div>
        {showLogin && (
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-zinc-300"
            aria-label="Entrar"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="hidden sm:inline">Entrar</span>
          </Link>
        )}
      </div>
    </div>
  );
}
