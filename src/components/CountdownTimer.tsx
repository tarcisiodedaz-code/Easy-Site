"use client";

import { useState, useEffect } from "react";

type CountdownTimerProps = {
  dataFinal: string; // ISO 8601, ex: "2025-12-31T23:59:59"
  className?: string;
  variant?: "default" | "boxes" | "boxesLarge" | "cyan"; // "boxes" = caixas; "boxesLarge" = banner pré-venda
};

type TimeLeft = {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  terminado: boolean;
};

function calcularRestante(dataFinal: Date): TimeLeft {
  const agora = new Date();
  const diff = dataFinal.getTime() - agora.getTime();

  if (diff <= 0) {
    return { dias: 0, horas: 0, minutos: 0, segundos: 0, terminado: true };
  }

  const segundos = Math.floor((diff / 1000) % 60);
  const minutos = Math.floor((diff / (1000 * 60)) % 60);
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

  return { dias, horas, minutos, segundos, terminado: false };
}

function DoisDigitos(n: number) {
  return n.toString().padStart(2, "0");
}

export function CountdownTimer({ dataFinal, className = "", variant = "default" }: CountdownTimerProps) {
  const [restante, setRestante] = useState<TimeLeft>(() =>
    calcularRestante(new Date(dataFinal))
  );

  useEffect(() => {
    const fim = new Date(dataFinal);
    const tick = () => setRestante(calcularRestante(fim));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dataFinal]);

  if (restante.terminado) {
    return (
      <div className={`text-center text-xl font-semibold text-white ${className}`}>
        Lançamento ao vivo!
      </div>
    );
  }

  const isCyan = variant === "cyan";
  const isBoxes = variant === "boxes" || variant === "boxesLarge";
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 ${className}`}
    >
      <Bloco valor={restante.dias} label="Dias" variant={variant} />
      {!isBoxes && <Separador cyan={isCyan} />}
      <Bloco valor={restante.horas} label="Hrs" variant={variant} />
      {!isBoxes && <Separador cyan={isCyan} />}
      <Bloco valor={restante.minutos} label="Min" variant={variant} />
      {!isBoxes && variant !== "cyan" && (
        <>
          <Separador cyan={false} />
          <Bloco valor={restante.segundos} label="Segundos" variant={variant} />
        </>
      )}
    </div>
  );
}

function Bloco({
  valor,
  label,
  variant,
}: {
  valor: number;
  label: string;
  variant?: "default" | "boxes" | "boxesLarge" | "cyan";
}) {
  const isBoxes = variant === "boxes";
  const isBoxesLarge = variant === "boxesLarge";
  const isCyan = variant === "cyan";
  if (isCyan) {
    return (
      <div
        className="flex min-w-[64px] flex-col items-center justify-center rounded-xl bg-cyan-500 px-3 py-3.5 shadow-lg sm:min-w-[72px] sm:px-4 sm:py-4"
        aria-label={`${label}: ${valor}`}
      >
        <span className="text-3xl font-bold tabular-nums text-white sm:text-4xl">
          {DoisDigitos(valor)}
        </span>
        <span className="mt-1 text-xs font-bold uppercase tracking-wide text-white/95">
          {label}
        </span>
      </div>
    );
  }
  if (isBoxesLarge) {
    return (
      <div
        className="flex min-w-[96px] flex-col items-center justify-center rounded-xl border-2 border-white/20 bg-[#1a1d23] px-4 py-4 shadow-[0_0_20px_rgba(99,102,241,0.35)] sm:min-w-[110px] sm:px-5 sm:py-5"
        aria-label={`${label}: ${valor}`}
      >
        <span className="text-4xl font-bold tracking-tighter text-white sm:text-5xl">
          {DoisDigitos(valor)}
        </span>
        <span className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-gray-300">
          {label}
        </span>
      </div>
    );
  }
  if (isBoxes) {
    return (
      <div
        className="flex min-w-[80px] flex-col items-center justify-center rounded-lg border border-[#3f3f46] bg-[#1a1d23] p-3 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
        aria-label={`${label}: ${valor}`}
      >
        <span className="text-3xl font-bold tracking-tighter text-white">
          {DoisDigitos(valor)}
        </span>
        <span className="text-[10px] font-medium uppercase text-gray-400">
          {label}
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center">
      <span
        className="min-w-[3.5rem] rounded-lg bg-zinc-800/90 px-3 py-2 font-mono text-2xl font-bold tabular-nums text-white shadow-inner sm:min-w-[4rem] sm:text-3xl"
        aria-label={`${label}: ${valor}`}
      >
        {DoisDigitos(valor)}
      </span>
      <span className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-400">
        {label}
      </span>
    </div>
  );
}

function Separador({ cyan }: { cyan?: boolean }) {
  return (
    <span
      className={`text-lg font-bold sm:text-xl ${cyan ? "text-cyan-400" : "text-zinc-500"}`}
      aria-hidden
    >
      :
    </span>
  );
}
