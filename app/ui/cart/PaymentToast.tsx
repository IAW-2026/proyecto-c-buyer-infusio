"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "./CartContext";

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-cream w-full max-w-sm px-10 py-12 text-center shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-brown/40 hover:text-brown transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

// ─── Payment Failed ───────────────────────────────────────────────────────────

function PaymentFailedModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  return (
    <Modal onClose={onClose}>
      <div className="flex justify-center mb-7">
        <div className="w-16 h-16 rounded-full border-2 border-terracotta flex items-center justify-center">
          <svg width="26" height="26" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-terracotta">
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        </div>
      </div>
      <h2 className="font-serif text-3xl text-brown mb-4">Pago fallido</h2>
      <p className="text-sm italic text-muted-foreground leading-relaxed mb-8">
        No pudimos procesar tu pago. Tu carrito fue restaurado — podés intentarlo nuevamente.
      </p>
      <div className="space-y-3">
        <button
          onClick={() => { onClose(); router.push("/cart"); }}
          className="w-full py-4 text-[11px] tracking-[0.2em] text-cream bg-terracotta hover:bg-brown transition-colors"
        >
          REINTENTAR
        </button>
        <button
          onClick={onClose}
          className="w-full py-4 text-[11px] tracking-[0.2em] text-brown border border-brown/30 hover:bg-tan/30 transition-colors"
        >
          CANCELAR
        </button>
      </div>
    </Modal>
  );
}

// ─── Payment Pending (inconclusive) ──────────────────────────────────────────

function PaymentPendingModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  return (
    <Modal onClose={onClose}>
      <div className="flex justify-center mb-7">
        <div className="w-16 h-16 rounded-full border-2 border-[#c8902a] flex items-center justify-center">
          <svg width="26" height="26" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#c8902a]">
            <line x1="10" y1="4" x2="10" y2="13" />
            <circle cx="10" cy="16.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </div>
      </div>
      <h2 className="font-serif text-3xl text-brown mb-4">Pago en proceso</h2>
      <p className="text-sm italic text-muted-foreground leading-relaxed mb-8">
        Tu pago quedó en proceso y el resultado todavía no fue confirmado.
        Podés verificar el estado en Mis Pedidos.
      </p>
      <div className="space-y-3">
        <button
          onClick={() => { onClose(); router.push("/orders"); }}
          className="w-full py-4 text-[11px] tracking-[0.2em] text-cream bg-[#c8902a] hover:bg-brown transition-colors"
        >
          VER MIS PEDIDOS
        </button>
        <button
          onClick={onClose}
          className="w-full py-4 text-[11px] tracking-[0.2em] text-brown border border-brown/30 hover:bg-tan/30 transition-colors"
        >
          SEGUIR NAVEGANDO
        </button>
      </div>
    </Modal>
  );
}

// ─── Payment Success ──────────────────────────────────────────────────────────

function PaymentSuccessModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  return (
    <Modal onClose={onClose}>
      <div className="flex justify-center mb-7">
        <div className="w-16 h-16 rounded-full border-2 border-olive flex items-center justify-center">
          <svg width="26" height="26" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-olive">
            <polyline points="4,11 8,15 16,5" />
          </svg>
        </div>
      </div>
      <h2 className="font-serif text-3xl text-brown mb-4">Pago exitoso</h2>
      <p className="text-sm italic text-muted-foreground leading-relaxed mb-8">
        Tu pago fue procesado exitosamente. ¡Gracias por tu compra!
      </p>
      <div className="space-y-3">
        <button
          onClick={() => { onClose(); router.push("/orders"); }}
          className="w-full py-4 text-[11px] tracking-[0.2em] text-cream bg-olive hover:bg-brown transition-colors"
        >
          VER MIS PEDIDOS
        </button>
        <button
          onClick={onClose}
          className="w-full py-4 text-[11px] tracking-[0.2em] text-brown border border-brown/30 hover:bg-tan/30 transition-colors"
        >
          CERRAR
        </button>
      </div>
    </Modal>
  );
}

// ─── Controller ───────────────────────────────────────────────────────────────

export default function PaymentModals() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refresh } = useCart();
  const [modal, setModal] = useState<"failed" | "pending" | "success" | null>(null);

  useEffect(() => {
    const failed  = searchParams.get("payment_failed")  === "true";
    const success = searchParams.get("payment_success") === "true";
    const pending = searchParams.get("payment_pending") === "true";

    if (!failed && !success && !pending) return;

    router.replace("/", { scroll: false });

    if (success) {
      refresh().catch(() => {});
      setModal("success");
      return;
    }

    if (pending) {
      const orderId = sessionStorage.getItem("pendingOrderId");
      sessionStorage.removeItem("pendingOrderId");
      sessionStorage.removeItem("failedCartId");
      if (orderId) {
        fetch(`/cart/orders/${orderId}`, { method: "PATCH" }).catch(() => {});
      }
      setModal("pending");
      return;
    }

    // failed path — restore cart then show modal
    const cartId = sessionStorage.getItem("failedCartId");
    sessionStorage.removeItem("failedCartId");
    sessionStorage.removeItem("pendingOrderId");

    if (cartId) {
      fetch("/cart/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId }),
      })
        .then(async (res) => {
          if (!res.ok) return;
          await refresh();
        })
        .catch(() => {})
        .finally(() => setModal("failed"));
    } else {
      setModal("failed");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (modal === "failed")  return <PaymentFailedModal  onClose={() => setModal(null)} />;
  if (modal === "pending") return <PaymentPendingModal onClose={() => setModal(null)} />;
  if (modal === "success") return <PaymentSuccessModal onClose={() => setModal(null)} />;
  return null;
}
