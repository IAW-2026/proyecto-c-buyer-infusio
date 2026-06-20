"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export interface CartItem {
  id: string;
  productId: string;
  sellerId: string | null;
  productName: string;
  productVariant: string | null;
  productImageUrl: string | null;
  priceAtTime: number;
  quantity: number;
}

export interface AddItemInput {
  productId: string;
  sellerId?: string | null;
  productName: string;
  productVariant?: string | null;
  productImageUrl?: string | null;
  priceAtTime: number;
  quantity: number;
}

interface CartContextValue {
  isOpen: boolean;
  items: CartItem[];
  loading: boolean;
  openCart: () => void;
  closeCart: () => void;
  refresh: () => Promise<void>;
  addItem: (item: AddItemInput) => Promise<void>;
  updateItemQty: (itemId: string, newQty: number) => void;
  removeItem: (productId: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isBroadcastRefresh = useRef(false);
  // productIds currently being deleted — refresh must not restore them
  const pendingRemovals = useRef(new Set<string>());
  // mirror of items state — readable synchronously inside callbacks
  const itemsRef = useRef<CartItem[]>([]);

  useEffect(() => { itemsRef.current = items; }, [items]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/cart/items");
      if (res.ok) {
        const data = await res.json();
        const fresh = (data.items ?? []) as CartItem[];
        // Filter out any items the user has already deleted but whose DELETE
        // request hasn't completed (or whose refresh fired concurrently).
        setItems(fresh.filter((i) => !pendingRemovals.current.has(i.productId)));
        if (!isBroadcastRefresh.current) {
          channelRef.current?.postMessage("cart-updated");
        }
      }
      // On error (401, network) keep existing items — avoids clearing optimistic state
    } catch {
      // same
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("cart-sync");
    channelRef.current = channel;
    channel.onmessage = () => {
      isBroadcastRefresh.current = true;
      refresh().finally(() => { isBroadcastRefresh.current = false; });
    };
    return () => channel.close();
  }, [refresh]);

  useEffect(() => {
    if (userId === undefined) return; // Clerk still initialising
    if (userId === null) {
      setItems([]);   // signed out — clear display, leave DB intact
      setIsOpen(false);
    } else {
      refresh();      // signed in — restore cart from DB
    }
  }, [userId, refresh]);

  const addItem = useCallback(async (item: AddItemInput) => {
    const tempId = `optimistic_${item.productId}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [
        ...prev,
        {
          id: tempId,
          productId: item.productId,
          sellerId: item.sellerId ?? null,
          productName: item.productName,
          productVariant: item.productVariant ?? null,
          productImageUrl: item.productImageUrl ?? null,
          priceAtTime: item.priceAtTime,
          quantity: item.quantity,
        },
      ];
    });
    setIsOpen(true);
    try {
      await fetch("/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    } finally {
      refresh();
    }
  }, [refresh]);

  const updateItemQty = useCallback((itemId: string, newQty: number) => {
    if (newQty < 1) return;
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, quantity: newQty } : i));
    fetch(`/cart/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQty }),
    }).catch(() => refresh());
  }, [refresh]);

  const removeItem = useCallback((productId: string) => {
    // Mark as pending so any concurrent refresh() doesn't restore this item
    pendingRemovals.current.add(productId);
    setItems((prev) => prev.filter((i) => i.productId !== productId));

    const dbId = itemsRef.current.find((i) => i.productId === productId)?.id;

    if (!dbId || dbId.startsWith("optimistic_")) {
      // Item hasn't been persisted yet — nothing to DELETE.
      // pendingRemovals blocks addItem's upcoming refresh from restoring it.
      // Clear the pending flag after a short window so it doesn't block future adds.
      setTimeout(() => pendingRemovals.current.delete(productId), 3000);
      return;
    }

    fetch(`/cart/items/${dbId}`, { method: "DELETE" })
      .finally(() => {
        pendingRemovals.current.delete(productId);
        refresh();
        // Re-render the /cart server page now that the deletion is confirmed in DB
        if (pathname === "/cart") router.refresh();
      });
  }, [refresh, router, pathname]);

  const openCart = useCallback(() => {
    setIsOpen(true);
    refresh();
  }, [refresh]);

  const closeCart = useCallback(() => setIsOpen(false), []);

  return (
    <CartContext.Provider value={{ isOpen, items, loading, openCart, closeCart, refresh, addItem, updateItemQty, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
