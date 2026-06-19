"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import type { ShipmentTrackingResponse } from "@/app/lib/services/externalApis";

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
  paymentId: string | null;
  shippingId: string | null;
  paymentUrl: string;
  items: OrderCartItem[];
}

interface Props {
  orders: OrderRow[];
  trackingMap: Record<string, ShipmentTrackingResponse | null>;
  trackingBase: string;
}

type Tab = "todos" | "pendientes" | "activos" | "compras";

const TABS: { id: Tab; label: string }[] = [
  { id: "todos",      label: "VER TODOS MIS PEDIDOS" },
  { id: "pendientes", label: "PEDIDOS PENDIENTES" },
  { id: "activos",    label: "PEDIDOS ACTIVOS" },
  { id: "compras",    label: "VER TODAS MIS COMPRAS" },
];

// ─── Status badge ─────────────────────────────────────────────────────────────

type BadgeInfo = { label: string; cls: string };

const CONFIRMED_STATUSES = ["PAYMENT_CONFIRMED", "PREPARING", "DISPATCHED"];
const ACTIVE_STATUSES    = ["PAYMENT_CONFIRMED", "PREPARING", "DISPATCHED"];

function getStatusBadge(order: OrderRow): BadgeInfo {
  if (order.status === "CANCELLED")                  return { label: "CANCELADO",  cls: "bg-[#eedede] text-[#904545]" };
  if (order.status === "DELIVERED")                  return { label: "FINALIZADO", cls: "bg-[#d8e0f0] text-[#2d4a7a]" };
  if (CONFIRMED_STATUSES.includes(order.status))     return { label: "CONFIRMADO", cls: "bg-[#dce6d8] text-[#4e7048]" };
  if (order.status === "PENDING" && order.paymentId) return { label: "PENDIENTE",  cls: "bg-[#f2e8c8] text-[#8a7030]" };
  return                                                    { label: "PROCESANDO", cls: "bg-tan/60 text-brown" };
}

function isOrderActive(order: OrderRow, tracking: ShipmentTrackingResponse | null) {
  if (!ACTIVE_STATUSES.includes(order.status)) return false;
  if (!tracking) return true;
  return !["DELIVERED", "CANCELLED"].includes(tracking.status);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrdersTable({ orders, trackingMap, trackingBase }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("todos");

  const filtered = orders.filter((o) => {
    const t = trackingMap[o.id] ?? null;
    if (activeTab === "pendientes") return o.status === "PENDING" && !!o.paymentId;
    if (activeTab === "activos")    return isOrderActive(o, t);
    if (activeTab === "compras")    return o.status === "DELIVERED" || o.status === "CANCELLED";
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
              onClick={() => setActiveTab("todos")}
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
                const badge    = getStatusBadge(order);
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
                          <span className={`inline-block min-w-27.5 text-center px-3 py-1 text-[10px] tracking-[0.12em] rounded-full whitespace-nowrap ${badge.cls}`}>
                            {badge.label}
                          </span>
                          {order.status === "PENDING" && !!order.paymentId ? (
                            <a
                              href={order.paymentUrl}
                              className="text-[11px] text-terracotta hover:text-brown transition-colors whitespace-nowrap"
                            >
                              Reintentar compra →
                            </a>
                          ) : (
                            order.shippingId && trackingBase && isOrderActive(order, tracking) && (
                              <Link
                                href={`${trackingBase}?code=${order.shippingId}`} target="_blank" rel="noopener noreferrer"
                                className="text-[11px] text-terracotta hover:text-brown transition-colors whitespace-nowrap"
                              >
                                Ver detalles de envío →
                              </Link>
                            )
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
              const badge    = getStatusBadge(order);
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

                  {order.status === "PENDING" && !!order.paymentId ? (
                    <a
                      href={order.paymentUrl}
                      className="block text-[11px] text-terracotta hover:text-brown transition-colors"
                    >
                      Reintentar compra →
                    </a>
                  ) : (
                    order.shippingId && trackingBase && isOrderActive(order, tracking) && (
                      <Link href={`${trackingBase}?code=${order.shippingId}`} target="_blank" rel="noopener noreferrer" className="block text-[11px] text-terracotta hover:text-brown transition-colors">
                        Ver detalles de envío →
                      </Link>
                    )
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
