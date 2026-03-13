"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "easy-games-cart";

export type CartItem = {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  imagem_url?: string | null;
};

type CartContextValue = {
  itens: CartItem[];
  total: number;
  count: number;
  addItem: (item: Omit<CartItem, "quantidade">) => void;
  removeItem: (id: string) => void;
  updateQuantidade: (id: string, quantidade: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(itens: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItens(loadFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(itens);
  }, [itens, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantidade">) => {
      setItens((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          return prev.map((i) =>
            i.id === item.id
              ? { ...i, quantidade: i.quantidade + 1 }
              : i
          );
        }
        return [...prev, { ...item, quantidade: 1 }];
      });
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setItens((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantidade = useCallback((id: string, quantidade: number) => {
    if (quantidade < 1) {
      setItens((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItens((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantidade } : i))
    );
  }, []);

  const total = useMemo(
    () => itens.reduce((s, i) => s + i.preco * i.quantidade, 0),
    [itens]
  );
  const count = useMemo(
    () => itens.reduce((s, i) => s + i.quantidade, 0),
    [itens]
  );

  const value = useMemo(
    () => ({
      itens,
      total,
      count,
      addItem,
      removeItem,
      updateQuantidade,
    }),
    [itens, total, count, addItem, removeItem, updateQuantidade]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
