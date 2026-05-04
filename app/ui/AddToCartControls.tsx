"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AddToCartControlsProps {
  productId: string;
  productName: string;
  productImageUrl?: string;
  priceAtTime: number;
  isOutOfStock: boolean;
  accent: "olive" | "terracotta";
}

export default function AddToCartControls({
  productId,
  productName,
  productImageUrl,
  priceAtTime,
  isOutOfStock,
  accent,
}: AddToCartControlsProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const btnBg = accent === "terracotta"
    ? "bg-terracotta hover:bg-brown"
    : "bg-olive hover:bg-brown";

  if (isOutOfStock) {
    return (
      <span className="block w-full py-3 text-center text-xs tracking-[0.15em] text-muted-foreground border border-tan">
        SIN STOCK
      </span>
    );
  }

  async function handleAdd() {
    setLoading(true);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, productName, productImageUrl, priceAtTime, quantity }),
      });

      if (res.status === 401) {
        router.push("/sign-in");
        return;
      }
      if (!res.ok) throw new Error();

      setAdded(true);
      router.refresh();
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // silent degradation
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
        className={`flex-1 py-3 text-xs tracking-[0.15em] font-medium text-cream ${btnBg} disabled:opacity-50 transition-colors`}
      >
        {loading ? "…" : added ? "¡AGREGADO!" : "AGREGAR AL CARRITO"}
      </button>
    </div>
  );
}
