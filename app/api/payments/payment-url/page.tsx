"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PagoContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("order_id") ?? "—";
  const amount = params.get("amount");
  const formatted = amount
    ? `$${Number(amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
    : "—";

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <p className="text-xs tracking-[0.25em] text-terracotta mb-4">SIMULACIÓN DE PAGO</p>
      <h1 className="font-serif text-4xl lg:text-5xl text-brown mb-3 leading-tight">
        Aquí completarías tu pago
      </h1>
      <p className="text-sm text-muted-foreground mb-2">
        Orden <span className="font-mono text-brown">{orderId}</span>
      </p>
      <p className="font-serif text-5xl text-brown mt-6 mb-12">{formatted}</p>

      <button
        onClick={() => router.push("/")}
        className="px-12 py-4 text-[11px] tracking-[0.2em] text-cream bg-olive hover:bg-brown transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
      >
        SIMULAR PAGO EXITOSO
      </button>
    </div>
  );
}

export default function PaymentUrlPage() {
  return (
    <Suspense>
      <PagoContent />
    </Suspense>
  );
}
