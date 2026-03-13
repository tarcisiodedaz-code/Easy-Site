"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { useCart } from "@/context/CartContext";
import type { ProdutoLoja } from "@/lib/supabase";

type Props = {
  produto: ProdutoLoja;
  className?: string;
  children?: React.ReactNode;
};

export function BuyNowButton({ produto, className = "", children }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  async function handleClick() {
    setLoading(true);

    if (isLoggedIn) {
      // Usuário logado: adiciona ao carrinho e vai para checkout
      addItem({
        id: produto.id!,
        nome: produto.nome,
        preco: produto.preco,
        imagem_url: produto.imagem_url,
        quantidade: 1,
      });
      router.push("/checkout");
    } else {
      // Usuário não logado: vai para login
      router.push("/login?redirect=/carrinho");
    }

    setLoading(false);
  }

  // Enquanto verifica login, mostra botão desabilitado
  if (isLoggedIn === null) {
    return (
      <button
        disabled
        className={`flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white opacity-50 ${className}`}
      >
        {children ?? "Comprar"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 ${className}`}
    >
      {loading ? "Aguarde..." : children ?? "Comprar"}
    </button>
  );
}
