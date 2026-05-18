"use client";

import { useAuth } from "@clerk/nextjs";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export interface FavouriteItem {
  productId: string;
  productName: string;
  productImageUrl: string | null;
  price: number;
  location: string | null;
  categories: string[];
  description: string | null;
}

interface FavouritesContextValue {
  items: FavouriteItem[];
  loading: boolean;
  justAdded: boolean;
  toggle: (product: FavouriteItem) => Promise<void>;
  isFavourited: (productId: string) => boolean;
  refresh: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [items, setItems] = useState<FavouriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/favourites/items");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId === undefined) return;
    if (userId === null) {
      setItems([]);
    } else {
      refresh();
    }
  }, [userId, refresh]);

  const isFavourited = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items]
  );

  const toggle = useCallback(
    async (product: FavouriteItem) => {
      const already = items.some((i) => i.productId === product.productId);
      const previous = items;
      setItems((prev) =>
        already
          ? prev.filter((i) => i.productId !== product.productId)
          : [product, ...prev]
      );
      if (!already) {
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 600);
      }
      try {
        if (already) {
          await fetch(`/favourites/items?productId=${product.productId}`, { method: "DELETE" });
        } else {
          const res = await fetch("/favourites/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product),
          });
          if (!res.ok) setItems(previous); // rollback on failure
        }
      } catch {
        setItems(previous); // rollback on network error
      }
    },
    [items]
  );

  const clearAll = useCallback(async () => {
    setItems([]);
    await fetch("/favourites/items?all=true", { method: "DELETE" });
  }, []);

  return (
    <FavouritesContext.Provider value={{ items, loading, justAdded, toggle, isFavourited, refresh, clearAll }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavourites must be inside FavouritesProvider");
  return ctx;
}
