"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import type { ShipmentTrackingResponse, ShipmentStatusValue } from "@/lib/services/externalApis";

export interface OrderCartItem {
  id: string;
  productName: string;
  productVariant: string | null;
  productImageUrl: string | null;
  priceAtTime: number;
  quantity: number;
}

export interface OrderRow {
  id: string;
  createdAt: Date;
  status: string;
  shippingId: string | null;
  items: OrderCartItem[];
}

interface Props {
  orders: OrderRow[];
  trackingMap: Record<string, ShipmentTrackingResponse | null>;
}

type Tab = "todas" | "activos" | "historial";

const TABS: { id: Tab; label: string }[] = [
  { id: "todas",     label: "VER TODAS MIS COMPRAS" },
  { id: "activos",   label: "PEDIDOS ACTIVOS" },
  { id: "historial", label: "HISTORIAL DE COMPRAS" },
];

// ─── Status badge ─────────────────────────────────────────────────────────────

type BadgeInfo = { label: string; cls: string };

function getStatusBadge(order: OrderRow, tracking: ShipmentTrackingResponse | null): BadgeInfo {
  if (order.status === "CANCELLED") return { label: "CANCELADO", cls: "bg-[#eedede] text-[#904545]" };
  if (!tracking) return { label: "PROCESANDO", cls: "bg-tan/60 text-brown" };

  const map: Record<ShipmentStatusValue, BadgeInfo> = {
    pending:    { label: "EN PREPARACIÓN", cls: "bg-[#e5e3ef] text-[#6a629a]" },
    prepared:   { label: "EN PREPARACIÓN", cls: "bg-[#e5e3ef] text-[#6a629a]" },
    dispatched: { label: "EN PREPARACIÓN", cls: "bg-[#e5e3ef] text-[#6a629a]" },
    in_transit: { label: "EN TRÁNSITO",    cls: "bg-[#f2e8c8] text-[#8a7030]" },
    delivered:  { label: "ENTREGADO",      cls: "bg-[#dce6d8] text-[#4e7048]" },
    cancelled:  { label: "CANCELADO",      cls: "bg-[#eedede] text-[#904545]" },
    incident:   { label: "INCIDENTE",      cls: "bg-[#eedede] text-[#904545]" },
  };
  return map[tracking.status] ?? { label: "PROCESANDO", cls: "bg-tan/60 text-brown" };
}

function isOrderActive(order: OrderRow, tracking: ShipmentTrackingResponse | null) {
  if (order.status === "CANCELLED") return false;
  if (!tracking) return true;
  return !["delivered", "cancelled"].includes(tracking.status);
}

function isOrderHistorical(order: OrderRow, tracking: ShipmentTrackingResponse | null) {
  if (order.status === "CANCELLED") return true;
  if (tracking && ["delivered", "cancelled"].includes(tracking.status)) return true;
  return false;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrdersTable({ orders, trackingMap }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("todas");

  const filtered = orders.filter((o) => {
    const t = trackingMap[o.id] ?? null;
    if (activeTab === "activos")   return isOrderActive(o, t);
    if (activeTab === "historial") return isOrderHistorical(o, t);
    return true;
  });

  return (
    <div className="mt-10">
      {/* Tab bar */}
      <div className="border-b border-tan flex gap-8 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-[10px] tracking-[0.18em] whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-[#302d2a] -mb-px text-[#302d2a]"
                : "text-[#302d2a]/50 hover:text-[#302d2a]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif text-2xl text-brown italic">No hay pedidos en esta categoría.</p>
          {orders.length > 0 && (
            <button
              onClick={() => setActiveTab("todas")}
              className="mt-6 text-xs tracking-[0.15em] text-olive hover:text-brown transition-colors"
            >
              VER TODOS →
            </button>
          )}
          {orders.length === 0 && (
            <Link href="/" className="mt-6 inline-block text-xs tracking-[0.15em] text-olive hover:text-brown transition-colors">
              EXPLORAR COLECCIÓN →
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <table className="hidden lg:table w-full text-left border-collapse mt-10 table-fixed">
            <colgroup>
              <col className="w-[11%]" />
              <col className="w-[19%]" />
              <col className="w-[34%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-brown/30">
                {["PEDIDO", "FECHA", "ESTADO", "ARTÍCULOS", "TOTAL", ""].map((h) => (
                  <th key={h} className="pb-5 text-[11px] tracking-[0.18em] font-bold text-brown">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const tracking = trackingMap[order.id] ?? null;
                const badge    = getStatusBadge(order, tracking);
                const total    = order.items.reduce((s, i) => s + i.priceAtTime * i.quantity, 0);

                return (
                  <Fragment key={order.id}>
                    <tr className="border-b border-brown/20 hover:bg-tan/10 transition-colors">
                      <td className="py-5 pr-4 font-serif text-sm text-brown">
                        #{order.id.slice(-4).toUpperCase()}
                      </td>
                      <td className="py-5 pr-4 text-sm text-brown">
                        {new Date(order.createdAt).toLocaleDateString("es-AR", {
                          day: "2-digit", month: "long", year: "numeric",
                        })}
                      </td>
                      <td className="py-5 pr-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`inline-block px-3 py-1 text-[10px] tracking-[0.12em] rounded-full whitespace-nowrap ${badge.cls}`}>
                            {badge.label}
                          </span>
                          {order.shippingId && isOrderActive(order, tracking) && (
                            <Link
                              href={`/api/shipping/shipping-url/${order.shippingId}`}
                              className="text-[11px] text-terracotta hover:text-brown transition-colors whitespace-nowrap"
                            >
                              Ver detalles de envío →
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="py-5 pr-4 text-sm text-brown">
                        {order.items.length} {order.items.length === 1 ? "artículo" : "artículos"}
                      </td>
                      <td className="py-5 pr-4 font-serif text-sm text-brown">
                        ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-5 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-[10px] tracking-[0.15em] text-brown underline underline-offset-2 hover:text-olive transition-colors"
                        >
                          DETALLES
                        </Link>
                      </td>
                    </tr>

                  </Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="lg:hidden mt-4 space-y-4">
            {filtered.map((order) => {
              const tracking = trackingMap[order.id] ?? null;
              const badge    = getStatusBadge(order, tracking);
              const total    = order.items.reduce((s, i) => s + i.priceAtTime * i.quantity, 0);

              return (
                <div key={order.id} className="border border-tan p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-serif text-sm text-brown">#{order.id.slice(-4).toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-[10px] tracking-[0.12em] rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{order.items.length} {order.items.length === 1 ? "artículo" : "artículos"}</span>
                    <span className="font-serif text-brown text-sm">
                      ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {order.shippingId && isOrderActive(order, tracking) && (
                    <Link href={`/api/shipping/shipping-url/${order.shippingId}`} className="block text-[11px] text-terracotta hover:text-brown transition-colors">
                      Ver detalles de envío →
                    </Link>
                  )}

                  <Link
                    href={`/orders/${order.id}`}
                    className="block text-[10px] tracking-[0.15em] text-brown underline underline-offset-2 hover:text-olive transition-colors"
                  >
                    DETALLES
                  </Link>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
