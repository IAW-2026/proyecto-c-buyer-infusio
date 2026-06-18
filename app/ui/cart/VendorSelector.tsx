"use client";

import Image from "next/image";
import { useState } from "react";
import CheckoutForm from "./CheckoutForm";

export interface VendorGroup {
  sellerId: string | null;
  items: {
    id: string;
    productId: string;
    productName: string;
    productVariant: string | null;
    productImageUrl: string | null;
    priceAtTime: number;
    quantity: number;
  }[];
  subtotal: number;
}

export default function VendorSelector({ groups }: { groups: VendorGroup[] }) {
  const [selected, setSelected] = useState<VendorGroup | null>(null);

  if (selected) {
    return <CheckoutForm items={selected.items} sellerId={selected.sellerId} />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-10">
        <p className="text-xs tracking-[0.2em] text-terracotta mb-3">TU CARRITO</p>
        <h1 className="font-serif text-4xl lg:text-5xl text-brown leading-tight">
          ¿Qué pedido querés pagar primero?
        </h1>
        <p className="text-sm italic text-muted-foreground mt-4 leading-relaxed">
          Tu carrito tiene productos de {groups.length} vendedores distintos.
          Cada uno se paga por separado.
        </p>
      </div>

      <div className="space-y-6">
        {groups.map((group, index) => {
          const preview = group.items.slice(0, 3);
          const remaining = group.items.length - preview.length;

          return (
            <div key={group.sellerId ?? "unknown"} className="border border-tan">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-tan/60">
                <p className="text-xs tracking-[0.2em] text-muted-foreground">
                  PEDIDO {index + 1}
                </p>
                <p className="font-serif text-lg text-brown">
                  ${group.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Items preview */}
              <div className="px-6 py-5 space-y-4">
                {preview.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="relative w-12 h-12 shrink-0 overflow-hidden bg-tan/50">
                      {item.productImageUrl ? (
                        <Image
                          src={item.productImageUrl}
                          alt={item.productName}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-tan/60" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-brown leading-snug truncate">{item.productName}</p>
                      {item.productVariant && (
                        <p className="text-[11px] italic text-muted-foreground mt-0.5">{item.productVariant}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">× {item.quantity}</p>
                  </div>
                ))}
                {remaining > 0 && (
                  <p className="text-xs italic text-muted-foreground">
                    + {remaining} producto{remaining !== 1 ? "s" : ""} más
                  </p>
                )}
              </div>

              {/* CTA */}
              <div className="px-6 pb-6">
                <button
                  onClick={() => setSelected(group)}
                  className="w-full py-3 text-[11px] tracking-[0.2em] text-cream bg-olive hover:bg-brown transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                >
                  PAGAR ESTE PEDIDO
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
