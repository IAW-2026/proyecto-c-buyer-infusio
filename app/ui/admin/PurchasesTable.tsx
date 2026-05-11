"use client";

import { Fragment, useState } from "react";
import type { PurchaseOrderStatus } from "@/generated/prisma/client";
import type { ShipmentStatusValue } from "@/app/lib/services/externalApis";

export interface AdminOrderItem {
  productName: string;
  quantity: number;
  priceAtTime: number;
}

export interface AdminOrderRow {
  id: string;
  status: PurchaseOrderStatus;
  shippingId: string | null;
  shipStatus: ShipmentStatusValue | null;
  createdAt: string;
  userName: string;
  userEmail: string;
  items: AdminOrderItem[];
  total: number;
}

interface Props {
  orders: AdminOrderRow[];
}

const ORDER_STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  PENDING:   "PROCESANDO",
  CONFIRMED: "CONFIRMADO",
  CANCELLED: "CANCELADO",
};

const ORDER_STATUS_CLS: Record<PurchaseOrderStatus, string> = {
  PENDING:   "bg-tan/60 text-brown",
  CONFIRMED: "bg-[#dce6d8] text-[#4e7048]",
  CANCELLED: "bg-[#eedede] text-[#904545]",
};

type BadgeInfo = { label: string; cls: string };

const SHIP_BADGE: Record<ShipmentStatusValue, BadgeInfo> = {
  pending:    { label: "EN PREPARACIÓN", cls: "bg-[#e5e3ef] text-[#6a629a]" },
  prepared:   { label: "EN PREPARACIÓN", cls: "bg-[#e5e3ef] text-[#6a629a]" },
  dispatched: { label: "EN PREPARACIÓN", cls: "bg-[#e5e3ef] text-[#6a629a]" },
  in_transit: { label: "EN TRÁNSITO",    cls: "bg-[#f2e8c8] text-[#8a7030]" },
  delivered:  { label: "ENTREGADO",      cls: "bg-[#dce6d8] text-[#4e7048]" },
  cancelled:  { label: "CANCELADO",      cls: "bg-[#eedede] text-[#904545]" },
  incident:   { label: "INCIDENTE",      cls: "bg-[#eedede] text-[#904545]" },
};

function formatId(id: string) {
  return `#INF-${id.slice(-4).toUpperCase()}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

export default function PurchasesTable({ orders }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <tr>
        <td colSpan={7} className="py-16 text-center font-serif text-xl text-muted-foreground">
          No hay pedidos para este filtro.
        </td>
      </tr>
    );
  }

  return (
    <>
      {orders.map((o) => {
        const isOpen = expandedId === o.id;
        const shipBadge = o.shipStatus ? SHIP_BADGE[o.shipStatus] : null;

        return (
          <Fragment key={o.id}>
            <tr
              className="border-b border-tan/60 hover:bg-tan/20 transition-colors cursor-pointer"
              onClick={() => setExpandedId(isOpen ? null : o.id)}
            >
              <td className="py-4 text-sm text-brown">{formatId(o.id)}</td>
              <td className="py-4">
                <p className="text-sm text-brown">{o.userName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{o.userEmail}</p>
              </td>
              <td className="py-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(o.createdAt)}</td>
              <td className="py-4">
                <span className="text-xs text-muted-foreground">
                  {o.items.length} producto{o.items.length !== 1 ? "s" : ""}
                </span>
                <span className={`ml-1.5 text-xs text-brown/50 transition-transform inline-block ${isOpen ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </td>
              <td className="py-4 text-sm font-medium text-brown">
                {o.total > 0
                  ? `$${o.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                  : "—"}
              </td>
              <td className="py-4">
                <span className={`px-3 py-1 rounded-full text-xs tracking-widest ${ORDER_STATUS_CLS[o.status]}`}>
                  {ORDER_STATUS_LABEL[o.status]}
                </span>
              </td>
              <td className="py-4">
                {shipBadge ? (
                  <span className={`px-3 py-1 rounded-full text-xs tracking-widest ${shipBadge.cls}`}>
                    {shipBadge.label}
                  </span>
                ) : o.shippingId ? (
                  <span className="text-xs text-muted-foreground">Sin datos</span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
            </tr>

            {isOpen && (
              <tr className="bg-tan/10 border-b border-tan/60">
                <td colSpan={7} className="px-6 py-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-tan/40">
                        <th className="pb-2 text-left text-xs tracking-[0.12em] text-terracotta font-normal">PRODUCTO</th>
                        <th className="pb-2 text-right text-xs tracking-[0.12em] text-terracotta font-normal">PRECIO UNIT.</th>
                        <th className="pb-2 text-right text-xs tracking-[0.12em] text-terracotta font-normal">CANT.</th>
                        <th className="pb-2 text-right text-xs tracking-[0.12em] text-terracotta font-normal">SUBTOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {o.items.map((item, i) => (
                        <tr key={i}>
                          <td className="py-2 text-sm text-brown">{item.productName}</td>
                          <td className="py-2 text-sm text-muted-foreground text-right">
                            ${item.priceAtTime.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 text-sm text-muted-foreground text-right">×{item.quantity}</td>
                          <td className="py-2 text-sm font-medium text-brown text-right">
                            ${(item.priceAtTime * item.quantity).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            )}
          </Fragment>
        );
      })}
    </>
  );
}
