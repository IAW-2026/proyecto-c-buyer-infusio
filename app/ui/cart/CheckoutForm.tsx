"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  productName: string;
  productVariant: string | null;
  productImageUrl: string | null;
  priceAtTime: number;
  quantity: number;
}

interface OrderData {
  purchase_order_id: string;
  shipping_cost: number;
  currency: string;
  payment_url: string;
}

export default function CheckoutForm({ items }: { items: CartItem[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    street: "",
    apartment: "",
    city: "",
    postalCode: "",
    province: "",
    country: "Argentina",
  });

  const subtotal = items.reduce((sum, i) => sum + i.priceAtTime * i.quantity, 0);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { street, city, province, postalCode } = form;
    if (!street || !city || !province || !postalCode) {
      setError("Completá todos los campos de dirección marcados como obligatorios.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/cart/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: { ...form, note } }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al procesar el pedido.");
      setLoading(false);
      return;
    }
    const data: OrderData = await res.json();
    setOrderData(data);
    setStep("confirm");
    setLoading(false);
  }

  const grandTotal = subtotal + (orderData?.shipping_cost ?? 0);

  return (
    <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-x-20 lg:items-start">

      {/* ── Left panel ── */}
      {step === "form" ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-10">
            <p className="text-xs tracking-[0.2em] text-terracotta mb-3">EL PASO FINAL</p>
            <h1 className="font-serif text-4xl lg:text-5xl text-brown leading-tight">
              Envío y Entrega
            </h1>
          </div>

          <Field label="CORREO ELECTRÓNICO">
            <Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="tu@email.com" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="NOMBRE">
              <Input name="firstName" value={form.firstName} onChange={handleChange} />
            </Field>
            <Field label="APELLIDO">
              <Input name="lastName" value={form.lastName} onChange={handleChange} />
            </Field>
          </div>

          <Field label="DIRECCIÓN DE ENVÍO">
            <Input name="street" value={form.street} onChange={handleChange} placeholder="Calle y número" required />
          </Field>

          <Field label="DEPTO., PISO, ETC. (OPCIONAL)">
            <Input name="apartment" value={form.apartment} onChange={handleChange} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="CIUDAD">
              <Input name="city" value={form.city} onChange={handleChange} required />
            </Field>
            <Field label="CÓDIGO POSTAL">
              <Input name="postalCode" value={form.postalCode} onChange={handleChange} required />
            </Field>
          </div>

          <Field label="PROVINCIA">
            <Input name="province" value={form.province} onChange={handleChange} required />
          </Field>

          <Field label="PAÍS / REGIÓN">
            <div className="w-full border border-tan bg-tan/20 px-4 py-3 text-sm text-brown select-none">
              Argentina
            </div>
          </Field>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-[11px] tracking-[0.2em] text-cream bg-olive hover:bg-brown disabled:opacity-40 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? "PROCESANDO..." : "COMPLETAR PEDIDO"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-8">
          <div className="mb-10">
            <p className="text-xs tracking-[0.2em] text-terracotta mb-3">PEDIDO CONFIRMADO</p>
            <h1 className="font-serif text-4xl lg:text-5xl text-brown leading-tight">
              Revisá los detalles
            </h1>
          </div>

          {/* Address summary */}
          <div className="border border-tan p-6 space-y-3">
            <p className="text-xs tracking-[0.15em] text-muted-foreground mb-4">DIRECCIÓN DE ENTREGA</p>
            {(form.firstName || form.lastName) && (
              <p className="text-sm text-brown">{form.firstName} {form.lastName}</p>
            )}
            <p className="text-sm text-brown">{form.street}{form.apartment ? `, ${form.apartment}` : ""}</p>
            <p className="text-sm text-brown">{form.city}, {form.province} {form.postalCode}</p>
            <p className="text-sm text-brown">{form.country}</p>
            {form.email && <p className="text-sm text-muted-foreground italic">{form.email}</p>}
          </div>

          {/* Shipping cost */}
          <div className="border-t border-tan pt-6 space-y-3">
            <div className="flex justify-between text-xs tracking-[0.12em]">
              <span className="text-muted-foreground">SUBTOTAL</span>
              <span className="text-brown">
                ${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-xs tracking-[0.12em]">
              <span className="text-muted-foreground">ENVÍO</span>
              <span className="text-brown">
                ${orderData!.shipping_cost.toLocaleString("es-AR", { minimumFractionDigits: 2 })} {orderData!.currency}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-4 border-t border-tan">
              <span className="text-xs tracking-[0.15em] text-muted-foreground">TOTAL</span>
              <span className="font-serif text-2xl text-brown">
                ${grandTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => router.push(orderData!.payment_url)}
              className="w-full py-4 text-[11px] tracking-[0.2em] text-cream bg-olive hover:bg-brown transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              IR A PAGAR
            </button>
          </div>
        </div>
      )}

      {/* ── Right: order summary ── */}
      <div className="mt-16 lg:mt-14 lg:sticky lg:top-24">
        <h2 className="font-serif text-3xl text-brown mb-8">Resumen del Pedido</h2>

        {/* Items */}
        <div className="border-t border-tan/60">
          {items.map((item) => {
            const lineTotal = item.priceAtTime * item.quantity;
            return (
              <div key={item.id} className="flex items-center gap-4 py-5 border-b border-tan/60">
                <div className="relative w-16 h-16 shrink-0 overflow-hidden bg-tan/50">
                  {item.productImageUrl ? (
                    <Image
                      src={item.productImageUrl}
                      alt={item.productName}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-tan/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm text-brown leading-snug">{item.productName}</p>
                  {item.productVariant && (
                    <p className="text-[11px] italic text-muted-foreground mt-0.5">{item.productVariant}</p>
                  )}
                  {item.quantity > 1 && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">× {item.quantity}</p>
                  )}
                </div>
                <p className="font-serif text-sm text-brown shrink-0">
                  ${lineTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            );
          })}
        </div>

        {/* Handwritten note — only on form step */}
        {step === "form" && (
          <div className="mt-7">
            <p className="text-xs tracking-[0.15em] text-muted-foreground mb-3">AGREGAR UNA NOTA ESCRITA A MANO</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Escribe un mensaje para el destinatario..."
              rows={4}
              className="w-full border border-tan bg-transparent px-4 py-3 text-sm text-brown placeholder:text-muted-foreground focus:outline-none focus:border-brown transition-colors resize-none"
            />
          </div>
        )}

        {/* Totals */}
        <div className="mt-7 space-y-3">
          <div className="flex justify-between text-xs tracking-[0.12em]">
            <span className="text-muted-foreground">SUBTOTAL</span>
            <span className="text-brown">
              ${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-xs tracking-[0.12em]">
            <span className="text-muted-foreground">ENVÍO</span>
            {step === "form" ? (
              <span className="text-muted-foreground italic text-[11px]">Se calcula al pagar</span>
            ) : (
              <span className="text-brown">
                ${orderData!.shipping_cost.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
          <div className="flex justify-between items-baseline pt-4 border-t border-tan">
            <span className="text-xs tracking-[0.15em] text-muted-foreground">
              {step === "form" ? "TOTAL EST." : "TOTAL"}
            </span>
            <span className="font-serif text-2xl text-brown">
              ${(step === "form" ? subtotal : grandTotal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}

const inputCls =
  "w-full border border-tan bg-transparent px-4 py-3 text-sm text-brown placeholder:text-muted-foreground focus:outline-none focus:border-brown transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs tracking-[0.15em] text-muted-foreground mb-2">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />;
}
