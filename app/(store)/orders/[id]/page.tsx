import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/lib/prisma";
import { getShipmentTracking } from "@/app/lib/services/externalApis";
import type { ShipmentStatusValue } from "@/app/lib/services/externalApis";

type BadgeInfo = { label: string; cls: string };

const STATUS_MAP: Record<ShipmentStatusValue, BadgeInfo> = {
  pending:    { label: "EN PREPARACIÓN", cls: "bg-[#e5e3ef] text-[#6a629a]" },
  prepared:   { label: "EN PREPARACIÓN", cls: "bg-[#e5e3ef] text-[#6a629a]" },
  dispatched: { label: "EN PREPARACIÓN", cls: "bg-[#e5e3ef] text-[#6a629a]" },
  in_transit: { label: "EN TRÁNSITO",    cls: "bg-[#f2e8c8] text-[#8a7030]" },
  delivered:  { label: "ENTREGADO",      cls: "bg-[#dce6d8] text-[#4e7048]" },
  cancelled:  { label: "CANCELADO",      cls: "bg-[#eedede] text-[#904545]" },
  incident:   { label: "INCIDENTE",      cls: "bg-[#eedede] text-[#904545]" },
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const order = await db.purchaseOrder.findUnique({
    where: { id },
    include: { cart: { include: { items: true } }, packages: true },
  });

  if (!order || order.userId !== userId) notFound();

  const tracking = order.shippingId
    ? await getShipmentTracking(order.shippingId).catch(() => null)
    : null;

  const items = order.cart.items;
  const subtotal = items.reduce((s, i) => s + Number(i.priceAtTime) * i.quantity, 0);
  const shippingCost = order.packages.reduce((s, p) => s + Number(p.shippingCost), 0);
  const total = subtotal + shippingCost;

  const badge: BadgeInfo =
    order.status === "CANCELLED"
      ? { label: "CANCELADO", cls: "bg-[#eedede] text-[#904545]" }
      : tracking
      ? STATUS_MAP[tracking.status] ?? { label: "PROCESANDO", cls: "bg-tan/60 text-brown" }
      : { label: "PROCESANDO", cls: "bg-tan/60 text-brown" };

  const address = order.userAddress as {
    street?: string; city?: string; province?: string; postalCode?: string;
  } | null;

  const orderedOn = new Date(order.createdAt).toLocaleDateString("es-AR", {
    day: "2-digit", month: "long", year: "numeric",
  }).toUpperCase();

  return (
    <div className="py-12 lg:py-20 px-6 lg:px-20 xl:px-32 max-w-5xl mx-auto">

      {/* Back link */}
      <Link
        href="/orders"
        className="text-[10px] tracking-[0.15em] text-muted-foreground hover:text-brown transition-colors"
      >
        ← VOLVER AL HISTORIAL
      </Link>

      {/* Order header */}
      <div className="mt-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-terracotta mb-2">
            ORDENADO EL {orderedOn}
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl text-brown leading-tight">
            Pedido #IF-{order.id.slice(-4).toUpperCase()}
          </h1>
        </div>
        <div className="flex flex-col items-start lg:items-end gap-2 shrink-0 lg:mt-2">
          <span className={`inline-block px-3 py-1 text-[10px] tracking-[0.12em] rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
          {order.shippingId && (
            <p className="text-[10px] tracking-[0.1em] text-muted-foreground">
              TRACKING: {order.shippingId.toUpperCase()}
            </p>
          )}
        </div>
      </div>

      <hr className="border-tan mt-8 mb-6" />

      {/* Items — open by default, ▲ collapses to ▼ */}
      <details open className="group">
        <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden mb-6">
          <span className="font-serif text-xl text-brown">
            Artículos{" "}
            <span className="font-sans text-sm text-muted-foreground font-normal">({items.length})</span>
          </span>
          <span className="text-[10px] text-muted-foreground rotate-180 group-open:rotate-0 transition-transform inline-block">
            ▲
          </span>
        </summary>

        <div>
          {items.map((item, idx) => (
            <div key={item.id}>
              <div className="flex items-center gap-5 py-5">
                <div className="relative w-16 h-16 shrink-0 bg-tan/40 overflow-hidden">
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
                  <Link
                    href={`/products/${item.productId}`}
                    className="font-serif text-sm text-olive hover:text-brown transition-colors leading-snug"
                  >
                    {item.productName}
                  </Link>
                  {item.productVariant && (
                    <p className="text-[10px] tracking-[0.1em] text-muted-foreground uppercase mt-0.5">
                      {item.productVariant}
                    </p>
                  )}
                </div>
                <p className="text-[11px] tracking-[0.1em] text-muted-foreground shrink-0">
                  QTY: {item.quantity}
                </p>
                <p className="font-serif text-sm text-brown shrink-0 ml-6 w-24 text-right">
                  ${(Number(item.priceAtTime) * item.quantity).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              {idx < items.length - 1 && <hr className="border-tan/60" />}
            </div>
          ))}
        </div>

        {/* Summary */}
        <hr className="border-tan mt-2 mb-6" />
        <div className="flex flex-col items-end gap-2.5">
          <div className="flex justify-between w-60">
            <span className="text-[10px] tracking-[0.15em] text-muted-foreground">SUBTOTAL</span>
            <span className="font-serif text-sm text-brown">
              ${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between w-60">
            <span className="text-[10px] tracking-[0.15em] text-muted-foreground">ENVÍO</span>
            <span className="font-serif text-sm text-brown">
              {shippingCost > 0
                ? `$${shippingCost.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                : "—"}
            </span>
          </div>
          <hr className="border-tan w-60" />
          <div className="flex justify-between w-60 pt-0.5">
            <span className="text-[10px] tracking-[0.15em] text-brown font-semibold">TOTAL</span>
            <span className="font-serif text-xl text-brown">
              ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </details>

      <hr className="border-tan mt-8" />

      {/* Shipping & Payment */}
      <details className="group border-b border-tan">
        <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden py-5">
          <span className="font-serif text-xl text-brown">Envío y pago</span>
          <span className="text-[10px] text-muted-foreground group-open:rotate-180 transition-transform inline-block">▼</span>
        </summary>
        <div className="pb-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <p className="text-[10px] tracking-[0.15em] text-muted-foreground mb-2">DIRECCIÓN DE ENTREGA</p>
            {address?.street ? (
              <div className="space-y-0.5 text-sm text-brown">
                <p>{address.street}</p>
                <p>{address.city}, {address.province}</p>
                <p className="text-muted-foreground text-xs">{address.postalCode}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sin información.</p>
            )}
          </div>
          <div>
            <p className="text-[10px] tracking-[0.15em] text-muted-foreground mb-2">MÉTODO DE PAGO</p>
            <p className="text-sm text-brown">Mercado Pago</p>
            {order.paymentId && (
              <p className="text-xs text-muted-foreground mt-1">
                N° de operación: {order.paymentId}
              </p>
            )}
          </div>
        </div>
      </details>

      <div className="mt-8 flex gap-4 flex-wrap">
        <button className="px-10 py-3.5 text-[10px] tracking-[0.2em] text-cream bg-brown hover:bg-olive transition-colors">
          REPETIR PEDIDO
        </button>
        <button className="px-10 py-3.5 text-[10px] tracking-[0.2em] text-brown border border-brown hover:bg-tan/30 transition-colors">
          DESCARGAR FACTURA
        </button>
      </div>
    </div>
  );
}
