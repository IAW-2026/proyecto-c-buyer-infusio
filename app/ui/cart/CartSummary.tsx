"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CartItem {
  priceAtTime: number | string;
  quantity: number;
}

export default function CartSummary({ items }: { items: CartItem[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [address, setAddress] = useState({
    street: "",
    city: "",
    province: "",
    postalCode: "",
  });

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.priceAtTime) * item.quantity,
    0
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleCheckout() {
    const { street, city, province, postalCode } = address;
    if (!street || !city || !province || !postalCode) {
      setError("Completá todos los campos de envío.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/cart/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al procesar el pedido.");
      setLoading(false);
      return;
    }

    const { checkout_url } = await res.json();
    router.push(checkout_url);
  }

  return (
    <aside className="border border-tan p-6 space-y-6">
      {/* Totals */}
      <div>
        <p className="text-xs tracking-[0.15em] text-muted-foreground mb-3">RESUMEN</p>
        <div className="flex justify-between text-sm text-brown mb-1">
          <span>Subtotal</span>
          <span className="font-serif">$ {subtotal.toLocaleString("es-AR")}</span>
        </div>
        <p className="text-xs italic text-muted-foreground">
          Envío calculado al confirmar
        </p>
      </div>

      {/* Address form */}
      <div className="space-y-3">
        <p className="text-xs tracking-[0.15em] text-muted-foreground">DIRECCIÓN DE ENVÍO</p>
        {(
          [
            { name: "street", placeholder: "Calle y número" },
            { name: "city", placeholder: "Ciudad" },
            { name: "province", placeholder: "Provincia" },
            { name: "postalCode", placeholder: "Código postal" },
          ] as const
        ).map(({ name, placeholder }) => (
          <input
            key={name}
            name={name}
            value={address[name]}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full border border-tan bg-transparent px-3 py-2 text-sm text-brown placeholder:text-muted-foreground focus:outline-none focus:border-brown transition-colors"
          />
        ))}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading || items.length === 0}
        className="w-full py-3 text-xs tracking-[0.15em] text-cream bg-olive hover:bg-brown disabled:opacity-40 transition-colors"
      >
        {loading ? "PROCESANDO..." : "CONFIRMAR PEDIDO"}
      </button>
    </aside>
  );
}
