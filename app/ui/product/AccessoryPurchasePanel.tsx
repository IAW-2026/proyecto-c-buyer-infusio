"use client";

import { useState } from "react";
import AddToCartControls from "@/app/ui/cart/AddToCartControls";

interface Props {
  productId: string;
  productName: string;
  priceAtTime: number;
  productImageUrl?: string;
  isOutOfStock: boolean;
  accent: "olive" | "terracotta" | "slate";
  colors: string[];
  unit?: string;
}

export default function AccessoryPurchasePanel({
  productId,
  productName,
  priceAtTime,
  productImageUrl,
  isOutOfStock,
  accent,
  colors,
  unit,
}: Props) {
  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors.length > 0 ? colors[0] : null
  );

  const variant = selectedColor ?? unit ?? undefined;

  return (
    <>
      {colors.length > 0 && (
        <div className="px-6 py-5 border-b border-[#DFD9DE]">
          <p className="text-xs tracking-[0.15em] text-muted-foreground mb-3">COLORWAY</p>
          <div className="flex gap-3">
            {colors.map((hex) => (
              <button
                key={hex}
                onClick={() => setSelectedColor(hex)}
                aria-label={`Seleccionar color ${hex}`}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  selectedColor === hex
                    ? "border-brown scale-110"
                    : "border-tan hover:border-brown/50"
                }`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="px-6 py-5">
        <p className="text-xs tracking-[0.15em] text-muted-foreground mb-3">CANTIDAD</p>
        <AddToCartControls
          productId={productId}
          productName={productName}
          productVariant={variant}
          productImageUrl={productImageUrl}
          priceAtTime={priceAtTime}
          isOutOfStock={isOutOfStock}
          accent={accent}
        />
      </div>
    </>
  );
}
