"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";

interface AddToCartControlsProps {
  productId: string;
  productName: string;
  productVariant?: string;
  productImageUrl?: string;
  priceAtTime: number;
  isOutOfStock: boolean;
  accent: "olive" | "terracotta" | "slate";
}

export default function AddToCartControls({
  productId,
  productName,
  productVariant,
  productImageUrl,
  priceAtTime,
  isOutOfStock,
  accent,
}: AddToCartControlsProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refresh, openCartSilent, applyOptimistic } = useCart();

  const btnCls =
    accent === "terracotta" ? "bg-terracotta hover:bg-brown text-cream" :
    accent === "slate"      ? "bg-[#DFD9DE] hover:bg-[#c8c1c7] text-brown" :
    /* olive */                "bg-olive hover:bg-brown text-cream";

  if (isOutOfStock) {
    return (
      <span className="block w-full py-3 text-center text-xs tracking-[0.15em] text-muted-foreground border border-tan">
        SIN STOCK
      </span>
    );
  }

  async function handleAdd() {
    const tempId = `optimistic_${productId}`;

    // Optimistically add to cart and open drawer immediately
    applyOptimistic((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          id: tempId,
          productId,
          productName,
          productVariant: productVariant ?? null,
          productImageUrl: productImageUrl ?? null,
          priceAtTime,
          quantity,
        },
      ];
    });
    openCartSilent();

    // Confirm with server in background
    setLoading(true);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, productName, productVariant, productImageUrl, priceAtTime, quantity }),
      });

      if (res.status === 401) {
        // Revert optimistic state, save for after sign-in
        applyOptimistic((prev) => prev.filter((i) => i.id !== tempId));
        sessionStorage.setItem(
          "pendingCartItem",
          JSON.stringify({ productId, productName, productVariant, productImageUrl, priceAtTime, quantity })
        );
        const { pathname, search } = new URL(window.location.href);
        router.push(`/sign-in?redirect_url=${encodeURIComponent(pathname + search)}`);
        return;
      }

      // Replace temp item with real DB data
      refresh();
    } catch {
      refresh(); // revert on network error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-stretch gap-2">
      {/* Quantity stepper */}
      <div className="flex items-center border border-tan">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="w-9 h-11 text-brown hover:bg-tan/50 transition-colors text-lg leading-none"
          aria-label="Reducir cantidad"
        >
          −
        </button>
        <span className="w-9 text-center text-sm text-brown select-none">{quantity}</span>
        <button
          onClick={() => setQuantity((q) => q + 1)}
          className="w-9 h-11 text-brown hover:bg-tan/50 transition-colors text-lg leading-none"
          aria-label="Aumentar cantidad"
        >
          +
        </button>
      </div>

      {/* Add to cart */}
      <button
        onClick={handleAdd}
        disabled={loading}
        className={`flex-1 py-3 text-xs tracking-[0.15em] font-medium ${btnCls} disabled:opacity-50 transition-colors`}
      >
        {loading ? "…" : "AGREGAR AL CARRITO"}
      </button>
    </div>
  );
}
