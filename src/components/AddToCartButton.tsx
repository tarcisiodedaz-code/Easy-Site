"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import type { ProdutoLoja } from "@/lib/supabase";

type AddToCartButtonProps = {
  produto: ProdutoLoja;
  variant?: "default" | "secondary" | "gradient" | "purple";
  className?: string;
  children?: React.ReactNode;
};

export function AddToCartButton({
  produto,
  variant = "default",
  className = "",
  children,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const id = produto.id ?? produto.id_externo;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id,
      nome: produto.nome,
      preco: produto.preco,
      imagem_url: produto.imagem_url,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const baseClass =
    "flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all duration-300 disabled:opacity-70 ";
  const styleClass =
    variant === "secondary"
      ? "border border-[var(--accent)] bg-transparent text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
      : variant === "gradient"
        ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/40 hover:brightness-110"
        : variant === "purple"
          ? "bg-violet-600 text-white shadow-md hover:bg-violet-500 hover:shadow-lg"
          : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={baseClass + styleClass + " " + className}
    >
      {added ? "Adicionado ✓" : children ?? "Adicionar ao carrinho"}
    </button>
  );
}
