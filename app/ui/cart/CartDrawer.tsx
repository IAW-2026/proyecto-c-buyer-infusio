"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";

const GRAIN_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E")`;

export default function CartDrawer() {
  const { isOpen, items, closeCart, refresh, applyOptimistic } = useCart();
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  function updateQty(itemId: string, newQty: number) {
    if (newQty < 1) return;
    applyOptimistic(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQty } : i));
    fetch(`/cart/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQty }),
    }).catch(() => refresh());
  }

  function removeItem(itemId: string) {
    applyOptimistic(prev => prev.filter(i => i.id !== itemId));
    fetch(`/cart/items/${itemId}`, { method: "DELETE" }).catch(() => refresh());
  }

  function handleCheckout() {
    closeCart();
    router.push("/cart");
  }

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.priceAtTime) * item.quantity,
    0
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-60 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={`fixed top-0 right-0 z-60 h-screen w-full max-w-[420px] shadow-2xl transition-transform duration-300 ease-in-out overflow-hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          backgroundColor: "#f4f1e9",
          backgroundImage: GRAIN_BG,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      >
        {/* ── Background decorative circles — behind everything ── */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-8 right-0 w-64 h-64 rounded-full translate-x-1/3"
            style={{ backgroundColor: "rgba(210, 190, 150, 0.28)" }}
          />
          <div
            className="absolute bottom-36 -left-10 w-56 h-56 rounded-full"
            style={{ backgroundColor: "rgba(155, 145, 195, 0.22)" }}
          />
        </div>

        {/* ── All content above the circles ── */}
        <div className="relative z-10 flex flex-col h-full">

          {/* Header */}
          <div className="flex items-start justify-between px-7 pt-7 pb-5 shrink-0">
            <h2 className="font-serif italic text-4xl leading-none" style={{ color: "#0B3033" }}>
              Tu Carrito
            </h2>
            <button
              onClick={closeCart}
              className="mt-1 text-muted-foreground hover:opacity-60 transition-opacity"
              aria-label="Cerrar carrito"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            </button>
          </div>

          {/* Divider */}

         {/* <div className="shrink-0 border-t border-tan/60 mx-7" />*/}


          {/* Items */}
          <div className="flex-1 overflow-y-auto px-7">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full pb-20 gap-4 text-center">
                <p className="font-serif text-2xl" style={{ color: "#0B3033" }}>Tu carrito está vacío</p>
                <p className="text-xs tracking-widest text-muted-foreground italic">
                  Explorá nuestra colección y encontrá algo especial.
                </p>
                <button
                  onClick={closeCart}
                  className="mt-2 text-xs tracking-[0.15em] border border-tan px-6 py-2 hover:border-brown transition-colors"
                  style={{ color: "#0B3033" }}
                >
                  VER COLECCIÓN
                </button>
              </div>
            ) : (
              <div>
                {items.map((item) => {
                  const lineTotal = Number(item.priceAtTime) * item.quantity;
                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 py-5 border-b border-tan/60 last:border-b-0"
                    >
                      {/* Image */}
                      <div className="relative w-20 h-25 shrink-0 bg-tan/50 overflow-hidden">
                        {item.productImageUrl ? (
                          <Image
                            src={item.productImageUrl}
                            alt={item.productName}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-tan/60" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col min-w-0 py-0.5">
                        {/* Name + line total */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-serif font-semibold text-[15px] leading-snug" style={{ color: "#0B3033" }}>
                            {item.productName}
                          </p>
                          <p className="font-serif text-[15px] shrink-0 leading-snug" style={{ color: "#4A2C1D" }}>
                            ${lineTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>

                        {/* Variant */}
                        {item.productVariant && (
                          <p className="text-[11px] tracking-[0.08em] mb-1" style={{ color: "#92A9A8" }}>
                            {item.productVariant}
                          </p>
                        )}

                        {/* Stepper + Eliminar */}
                        <div className="flex items-center justify-between mt-auto pt-3">
                          <div className="flex items-center border border-tan/80">
                            <button
                              onClick={() => updateQty(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 flex items-center justify-center text-sm hover:bg-tan/50 disabled:opacity-30 transition-colors select-none"
                              style={{ color: "#4A2C1D" }}
                              aria-label="Reducir cantidad"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm select-none border-x border-tan/80" style={{ color: "#4A2C1D" }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center text-sm hover:bg-tan/50 transition-colors select-none"
                              style={{ color: "#4A2C1D" }}
                              aria-label="Aumentar cantidad"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-[10px] tracking-[0.12em] transition-colors hover:opacity-70"
                            style={{ color: "#BB6D51" }}
                          >
                            ELIMINAR
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="shrink-0 border-t border-tan/60 px-7 py-6 space-y-4 bg-cream">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] tracking-[0.18em] text-muted-foreground">SUBTOTAL EST.</span>
                <span className="font-serif text-3xl" style={{ color: "#0B3033" }}>
                  ${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full py-4 text-[11px] tracking-[0.2em] text-cream rounded-full transition-all duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.99]"
                style={{ backgroundColor: "#B15637" }}
              >
                PROCEDER AL PAGO
              </button>
              <div className="text-center">
                <button
                  onClick={closeCart}
                  className="font-serif italic text-sm hover:opacity-70 transition-opacity"
                  style={{ color: "#0B3033" }}
                >
                  Seguir comprando →
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
