"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useFavourites, type FavouriteItem } from "./FavouritesContext";

interface Props {
  product: FavouriteItem;
  variant?: "overlay" | "row";
  className?: string;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className="w-4 h-4 text-brown"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default function FavouriteButton({ product, variant = "overlay", className }: Props) {
  const { isFavourited, toggle } = useFavourites();
  const { userId } = useAuth();
  const router = useRouter();
  const active = isFavourited(product.productId);
  const [justAdded, setJustAdded] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) {
      sessionStorage.setItem("pendingFavourite", JSON.stringify(product));
      const { pathname, search } = new URL(window.location.href);
      router.push(`/sign-in?redirect_url=${encodeURIComponent(pathname + search)}`);
      return;
    }
    if (!active) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 500);
      if (variant === "overlay") {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        window.dispatchEvent(
          new CustomEvent("favourite-added", {
            detail: {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
              imageUrl: product.productImageUrl,
            },
          })
        );
      }
    }
    toggle(product);
  }

  if (variant === "row") {
    return (
      <button
        onClick={handleClick}
        aria-label={active ? "Quitar de colección" : "Guardar en colección"}
        className={`flex items-center justify-center gap-2 w-full py-3 text-xs tracking-[0.15em] text-muted-foreground hover:text-brown border border-tan hover:border-brown transition-colors ${className ?? ""}`}
      >
        <StarIcon filled={active} />
        {active ? "GUARDADO EN COLECCIÓN" : "GUARDAR EN COLECCIÓN"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      aria-label={active ? "Quitar de colección" : "Guardar en colección"}
      className={`relative flex items-center justify-center w-9 h-9 rounded-full bg-cream/80 backdrop-blur-sm hover:bg-cream transition-colors ${className ?? ""}`}
    >
      {justAdded && (
        <span className="absolute inset-0 rounded-full bg-brown/10 animate-ping" />
      )}
      <span className={justAdded ? "animate-star-pop" : ""}>
        <StarIcon filled={active} />
      </span>
    </button>
  );
}
