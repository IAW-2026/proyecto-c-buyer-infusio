"use client";

import { useAuth } from "@clerk/nextjs";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productVariant: string | null;
  productImageUrl: string | null;
  priceAtTime: number | string;
  quantity: number;
}

interface CartContextValue {
  isOpen: boolean;
  items: CartItem[];
  loading: boolean;
  openCart: () => void;
  openCartSilent: () => void;
  closeCart: () => void;
  refresh: () => Promise<void>;
  applyOptimistic: (updater: (prev: CartItem[]) => CartItem[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/cart/items");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
      // On error (401, network) keep existing items — avoids clearing optimistic state
    } catch {
      // same
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId === undefined) return; // Clerk still initialising
    if (userId === null) {
      setItems([]);   // signed out — clear display, leave DB intact
      setIsOpen(false);
    } else {
      refresh();      // signed in — restore cart from DB
    }
  }, [userId, refresh]);

  const applyOptimistic = useCallback(
    (updater: (prev: CartItem[]) => CartItem[]) => setItems(updater),
    []
  );

  const openCart = useCallback(() => {
    setIsOpen(true);
    refresh();
  }, [refresh]);

  // Opens drawer without triggering a refresh — use after optimistic add
  const openCartSilent = useCallback(() => setIsOpen(true), []);

  const closeCart = useCallback(() => setIsOpen(false), []);

  return (
    <CartContext.Provider value={{ isOpen, items, loading, openCart, openCartSilent, closeCart, refresh, applyOptimistic }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
