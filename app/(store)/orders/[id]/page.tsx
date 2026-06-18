import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getOrderById } from "@/app/lib/services/externalApis";
import RepeatOrderButton from "@/app/ui/cart/RepeatOrderButton";

type BadgeInfo = { label: string; cls: string };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const order = await getOrderById(id).catch(() => null);

  if (!order || order.user_id !== userId) notFound();

  const items = order.cart_items;
  const subtotal = items.reduce((s, i) => s + i.price_at_time * i.quantity, 0);
  const shippingCost = order.shipping_cost;
  const total = subtotal + shippingCost;

  const badge: BadgeInfo =
    order.status === "CANCELLED"        ? { label: "CANCELADO",  cls: "bg-[#eedede] text-[#904545]" } :
    order.status === "CONFIRMED"        ? { label: "CONFIRMADO", cls: "bg-[#dce6d8] text-[#4e7048]" } :
    order.status === "AWAITING_PAYMENT" ? { label: "PENDIENTE",  cls: "bg-[#f2e8c8] text-[#8a7030]" } :
                                          { label: "PROCESANDO", cls: "bg-tan/60 text-brown" };

  const orderedOn = new Date(order.created_at).toLocaleDateString("es-AR", {
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
            Pedido #IF-{order.purchase_order_id.slice(-4).toUpperCase()}
          </h1>
        </div>
        <div className="flex flex-col items-start lg:items-end gap-2 shrink-0 lg:mt-2">
          <span className={`inline-block px-3 py-1 text-[10px] tracking-[0.12em] rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
          {order.shipping_id && (
            <p className="text-[10px] tracking-widest text-muted-foreground">
              TRACKING: {order.shipping_id.toUpperCase()}
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
                  {item.product_image_url ? (
                    <Image
                      src={item.product_image_url}
                      alt={item.product_name}
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
                    href={`/products/${item.product_id}`}
                    className="font-serif text-sm text-olive hover:text-brown transition-colors leading-snug"
                  >
                    {item.product_name}
                  </Link>
                  {item.product_variant && (
                    <p className="text-[10px] tracking-[0.1em] text-muted-foreground uppercase mt-0.5">
                      {item.product_variant}
                    </p>
                  )}
                </div>
                <p className="text-[11px] tracking-[0.1em] text-muted-foreground shrink-0">
                  QTY: {item.quantity}
                </p>
                <p className="font-serif text-sm text-brown shrink-0 ml-6 w-24 text-right">
                  ${(item.price_at_time * item.quantity).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
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
        <div className="pb-6 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] tracking-[0.15em] text-muted-foreground mb-2">DIRECCIÓN DE ENTREGA</p>
              {order.address ? (
                <p className="text-sm text-brown leading-relaxed">{order.address}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sin información.</p>
              )}
            </div>
            <div>
              <p className="text-[10px] tracking-[0.15em] text-muted-foreground mb-2">MÉTODO DE PAGO</p>
              <p className="text-sm text-brown">Mercado Pago</p>
              {order.payment_id && (
                <p className="text-xs text-muted-foreground mt-1">
                  N° de operación: {order.payment_id}
                </p>
              )}
              {order.status === "AWAITING_PAYMENT" && order.payment_url && (
                <a
                  href={order.payment_url}
                  className="mt-4 inline-block px-8 py-3 text-[10px] tracking-[0.2em] text-cream bg-terracotta hover:bg-brown transition-colors"
                >
                  REINTENTAR COMPRA
                </a>
              )}
            </div>
          </div>

          {order.shipping_id && (
            <iframe
              src={`https://proyecto-c-shipping-infusio.vercel.app/tracking/embed?code=${encodeURIComponent(order.shipping_id)}`}
              title="Seguimiento"
              className="w-full h-80 border-0"
              loading="lazy"
              allow="geolocation *"
            />
          )}
        </div>
      </details>

      <div className="mt-8 flex gap-4 flex-wrap items-start">
        <RepeatOrderButton
          items={items.map((i) => ({
            productId: i.product_id,
            productName: i.product_name,
            productVariant: i.product_variant,
            productImageUrl: i.product_image_url,
            priceAtTime: i.price_at_time,
            quantity: i.quantity,
          }))}
        />
        <a
          href={`/orders/${id}/invoice`}
          className="px-10 py-3.5 text-[10px] tracking-[0.2em] text-brown border border-brown hover:bg-tan/30 transition-colors"
        >
          DESCARGAR FACTURA
        </a>
      </div>
    </div>
  );
}
