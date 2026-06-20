"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useFavourites } from "@/app/ui/favourites/FavouritesContext";
import FavouriteButton from "@/app/ui/favourites/FavouriteButton";


const CupPlaceholder = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <svg className="h-16 w-16 opacity-[0.18] text-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8}>
      <path d="M8 5c-.6-.6-.6-1.4 0-2" />
      <path d="M12 5c-.6-.6-.6-1.4 0-2" />
      <path d="M4 7h13v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
      <path d="M17 10h1.5a2 2 0 010 4H17" />
      <line x1="2" y1="20" x2="20" y2="20" />
    </svg>
  </div>
);

export default function FavouritesPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const { items, loading, clearAll } = useFavourites();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    setSharing(true);
    try {
      const res = await fetch("/favourites/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        const { token } = await res.json();
        setShareUrl(`${window.location.origin}/favourites/share/${token}`);
      }
    } finally {
      setSharing(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    if (isLoaded && !userId) router.push("/sign-in");
  }, [isLoaded, userId, router]);

  if (!isLoaded || !userId) return null;

  const discoveryValue = items.reduce((sum, i) => sum + i.price, 0);

  return (
    <section className="py-12 lg:py-20 px-6 lg:px-12">
      <div className="max-w-350 mx-auto">

        {/* Header */}
        <div className="pt-20 lg:pt-10 pb-12 border-b border-tan">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="font-serif text-5xl lg:text-7xl text-brown mb-3">Tu Colección</h1>
              <p className="text-sm italic text-muted-foreground">
                Productos guardados cuidadosamente para tu próxima taza.
              </p>
            </div>
            {items.length > 0 && (
              <div className="flex items-center gap-6 shrink-0">
                <p className="text-xs tracking-[0.2em] text-muted-foreground">
                  {items.length} {items.length === 1 ? "ÍTEM" : "ÍTEMS"} EN TOTAL
                </p>
                <button
                  onClick={clearAll}
                  className="text-xs tracking-[0.15em] text-muted-foreground underline underline-offset-4 hover:text-brown transition-colors"
                >
                  BORRAR COLECCIÓN
                </button>
              </div>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="py-32 text-center">
            {loading ? (
              <p className="text-sm italic text-muted-foreground">Cargando tu colección…</p>
            ) : (
              <>
                <p className="font-serif text-3xl text-brown mb-4">Tu colección está vacía</p>
                <p className="text-sm italic text-muted-foreground mb-8">
                  Guardá los productos que te gusten para encontrarlos fácilmente.
                </p>
                <Link
                  href="/?query=cafe"
                  className="text-xs tracking-[0.15em] text-brown border border-tan px-6 py-3 hover:bg-tan/30 transition-colors"
                >
                  EXPLORAR CATÁLOGO
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="lg:flex lg:gap-12 mt-12">

            {/* Product grid */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                  const label = item.location ?? item.categories[0]?.toUpperCase() ?? "";

                  return (
                    <article key={item.productId} className="flex flex-col">
                      <div className="relative aspect-3/4 overflow-hidden bg-tan flex-shrink-0">
                        <Link href={`/products/${item.productId}`} tabIndex={-1} aria-hidden>
                          {item.productImageUrl ? (
                            <Image
                              src={item.productImageUrl}
                              alt={item.productName}
                              fill
                              className="object-cover transition-transform duration-500 hover:scale-105"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          ) : (
                            <CupPlaceholder />
                          )}
                        </Link>
                        <div className="absolute top-3 right-3">
                          <FavouriteButton product={item} />
                        </div>
                      </div>

                      <div className="pt-4 flex flex-col flex-1">
                        <div className="flex items-baseline justify-between mb-3">
                          <p className="text-xs tracking-[0.15em] text-[#8B9A8B]">
                            {label.toUpperCase()}
                          </p>
                          <p className="text-sm font-medium text-[#8B9A8B]">
                            $ {item.price.toLocaleString("es-AR")}
                          </p>
                        </div>
                        <Link href={`/products/${item.productId}`}>
                          <h2 className="font-serif text-xl text-brown leading-snug line-clamp-2 min-h-[3.5rem] hover:opacity-70 transition-opacity">
                            {item.productName}
                          </h2>
                        </Link>
                        {item.description && (
                          <p className="mt-2 text-sm italic text-muted-foreground leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="mt-16 lg:mt-0 lg:w-60 shrink-0">
              <div className="border border-tan p-6 mb-6">
                <h2 className="font-serif text-2xl text-brown mb-6">Resumen</h2>
                <div className="space-y-4 border-b border-tan pb-6">
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs tracking-[0.15em] text-muted-foreground">GUARDADOS</p>
                    <p className="font-serif text-xl text-brown">{items.length}</p>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs tracking-[0.15em] text-muted-foreground">VALOR TOTAL</p>
                    <p className="font-serif text-sm text-brown">
                      ${discoveryValue.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                {shareUrl ? (
                  <div className="mt-6 space-y-2">
                    <p className="text-[10px] tracking-[0.15em] text-muted-foreground">LINK GENERADO</p>
                    <div className="flex items-center gap-2 border border-tan px-3 py-2">
                      <p className="flex-1 text-xs text-brown truncate">{shareUrl}</p>
                      <button
                        onClick={handleCopy}
                        className="shrink-0 text-xs tracking-widest text-[#8B9A8B] hover:text-brown transition-colors"
                      >
                        {copied ? "¡COPIADO!" : "COPIAR"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleShare}
                    disabled={sharing}
                    className="mt-6 w-full py-3 text-xs tracking-[0.15em] bg-[#8B9A8B] text-cream hover:bg-[#7a877a] transition-colors disabled:opacity-60"
                  >
                    {sharing ? "GENERANDO…" : "COMPARTIR SELECCIÓN"}
                  </button>
                )}
              </div>

              <div className="border border-tan p-6">
                <p className="text-xs tracking-[0.15em] text-muted-foreground mb-4">EXPLORAR MÁS</p>
                <div className="space-y-3">
                  {[
                    { href: "/?query=cafe",        label: "Café de especialidad" },
                    { href: "/?query=infusiones",  label: "Infusiones & tés" },
                    { href: "/?query=accesorios",  label: "Accesorios" },
                    { href: "/?query=maquinas",    label: "Máquinas" },
                  ].map(({ href, label }) => (
                    <Link key={href} href={href} className="block text-sm text-muted-foreground hover:text-brown transition-colors">
                      {label} →
                    </Link>
                  ))}
                </div>
                <p className="mt-6 pt-4 border-t border-tan text-[10px] tracking-widest text-muted-foreground/60 leading-relaxed">
                  PRODUCCIÓN SOSTENIBLE
                </p>
              </div>
            </aside>

          </div>
        )}
      </div>
    </section>
  );
}
