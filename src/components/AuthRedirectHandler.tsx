"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Detecta tokens de autenticação na URL (ex.: recovery, signup) e redireciona
 * para a página apropriada. O Supabase envia o token no hash (#) da URL.
 */
export function AuthRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (!hash || !hash.includes("type=")) return;

    const params = new URLSearchParams(hash.replace("#", ""));
    const type = params.get("type");

    if (type === "recovery") {
      // Redireciona para a página de redefinir senha, mantendo o hash
      router.replace(`/redefinir-senha${hash}`);
    }
  }, [router]);

  return null;
}
