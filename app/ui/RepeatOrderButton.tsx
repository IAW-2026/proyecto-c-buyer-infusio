"use client";

import { useState } from "react";
import { useCart } from "@/app/ui/CartContext";

interface OrderItem {
  productId: string;
  productName: string;
  productVariant: string | null;
  productImageUrl: string | null;
  priceAtTime: number;
  quantity: number;
}

interface Props {
  items: OrderItem[];
}

export default function RepeatOrderButton({ items }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { refresh, openCart } = useCart();

  async function handleRepeat() {
    setLoading(true);
    setError(false);
    try {
      await Promise.all(
        items.map((item) =>
          fetch("/api/cart/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: item.productId,
              productName: item.productName,
              productVariant: item.productVariant,
              productImageUrl: item.productImageUrl,
              priceAtTime: item.priceAtTime,
              quantity: item.quantity,
            }),
          })
        )
      );
      await refresh();
      openCart();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleRepeat}
        disabled={loading}
        className="px-10 py-3.5 text-[10px] tracking-[0.2em] text-cream bg-brown hover:bg-olive disabled:opacity-60 transition-colors"
      >
        {loading ? "AGREGANDO…" : "REPETIR PEDIDO"}
      </button>
      {error && (
        <p className="text-[10px] text-[#904545] tracking-[0.1em]">
          No se pudo agregar. Intentá de nuevo.
        </p>
      )}
    </div>
  );
}
