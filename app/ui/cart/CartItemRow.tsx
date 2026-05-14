"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  priceAtTime: number | string;
  quantity: number;
}

export default function CartItemRow({ item }: { item: CartItem }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(item.quantity);
  const [loading, setLoading] = useState(false);

  const price = Number(item.priceAtTime);

  async function updateQuantity(newQty: number) {
    if (newQty < 1) return;
    setLoading(true);
    setQuantity(newQty);
    await fetch(`/cart/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQty }),
    });
    setLoading(false);
    router.refresh();
  }

  async function remove() {
    setLoading(true);
    await fetch(`/cart/items/${item.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex gap-4 py-6 border-b border-tan">
      {/* Image */}
      <div className="relative w-20 h-20 shrink-0 bg-tan overflow-hidden">
        {item.productImageUrl ? (
          <Image
            src={item.productImageUrl}
            alt={item.productName}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-tan" />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <p className="font-serif text-base text-brown truncate">{item.productName}</p>
        <p className="text-xs tracking-[0.1em] text-muted-foreground">
          $ {price.toLocaleString("es-AR")} c/u
        </p>

        {/* Quantity stepper */}
        <div className="flex items-center gap-3 mt-auto">
          <button
            onClick={() => updateQuantity(quantity - 1)}
            disabled={loading || quantity <= 1}
            className="w-7 h-7 flex items-center justify-center border border-tan text-brown hover:border-brown disabled:opacity-30 transition-colors"
            aria-label="Reducir cantidad"
          >
            −
          </button>
          <span className="text-sm text-brown w-4 text-center">{quantity}</span>
          <button
            onClick={() => updateQuantity(quantity + 1)}
            disabled={loading}
            className="w-7 h-7 flex items-center justify-center border border-tan text-brown hover:border-brown disabled:opacity-30 transition-colors"
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>
      </div>

      {/* Subtotal + remove */}
      <div className="flex flex-col items-end justify-between shrink-0">
        <p className="font-serif text-base text-brown">
          $ {(price * quantity).toLocaleString("es-AR")}
        </p>
        <button
          onClick={remove}
          disabled={loading}
          className="text-xs tracking-[0.1em] text-muted-foreground hover:text-brown transition-colors disabled:opacity-30"
        >
          ELIMINAR
        </button>
      </div>
    </div>
  );
}
