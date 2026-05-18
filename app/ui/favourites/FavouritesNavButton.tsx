"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useFavourites } from "./FavouritesContext";


const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const CupPlaceholder = () => (
  <svg className="w-5 h-5 opacity-20 text-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8}>
    <path d="M8 5c-.6-.6-.6-1.4 0-2" />
    <path d="M12 5c-.6-.6-.6-1.4 0-2" />
    <path d="M4 7h13v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
    <path d="M17 10h1.5a2 2 0 010 4H17" />
    <line x1="2" y1="20" x2="20" y2="20" />
  </svg>
);

export default function FavouritesNavButton({ className }: { className?: string }) {
  const { userId } = useAuth();
  const { items, toggle, justAdded } = useFavourites();
  const pathname = usePathname();
  const isActive = pathname === "/favourites";

  if (!userId) return null;

  return (
    <div className="relative group flex items-center">
      <Link
        href="/favourites"
        className={`flex items-center leading-none transition-colors hover:text-olive ${className ?? ""}`}
        aria-label="Favourites"
        data-heart-target
      >
        <span className={justAdded ? "animate-heart-beat" : ""}>
          <HeartIcon filled={isActive} />
        </span>
      </Link>

      <div className="absolute right-0 top-full pt-2 w-72 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50">
        <div className="bg-cream border border-tan shadow-lg rounded-xl">
          {items.length === 0 ? (
            <p className="px-4 py-5 text-xs italic text-muted-foreground text-center">
              No tenés ningún favorito marcado todavía.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-tan">
                <p className="text-xs tracking-[0.2em] text-brown">TU COLECCIÓN</p>
                <span className="text-[10px] tracking-[0.15em] text-brown/60 bg-tan/60 px-2 py-0.5">
                  {items.length} {items.length === 1 ? "ÍTEM" : "ÍTEMS"}
                </span>
              </div>

              <div className="px-4 py-3 space-y-3 max-h-56 overflow-y-auto">
                {items.slice(0, 4).map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-tan shrink-0 overflow-hidden flex items-center justify-center">
                      {item.productImageUrl ? (
                        <Image src={item.productImageUrl} alt={item.productName} width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <CupPlaceholder />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm text-brown leading-tight truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">${item.price.toLocaleString("es-AR")}</p>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); toggle(item); }}
                      className="shrink-0 text-brown/30 hover:text-brown transition-colors text-xl leading-none"
                      aria-label={`Quitar ${item.productName}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <Link
                href="/favourites"
                className="block text-center py-3 text-xs tracking-[0.15em] bg-[#8B9A8B] text-cream hover:bg-[#7a877a] transition-colors rounded-b-xl"
              >
                VER COLECCIÓN COMPLETA →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
