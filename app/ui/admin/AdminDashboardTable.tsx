"use client";

import { Fragment, useState } from "react";
import type { PurchaseOrderStatus } from "@/generated/prisma/client";

export interface DashboardOrderRow {
  id: string;
  status: PurchaseOrderStatus;
  createdAt: string;
  userName: string;
  items: { productName: string; quantity: number }[];
  total: string;
}

interface Props {
  orders: DashboardOrderRow[];
}

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  PENDING:          "PROCESANDO",
  AWAITING_PAYMENT: "PENDIENTE",
  CONFIRMED:        "CONFIRMADO",
  CANCELLED:        "CANCELADO",
};

const STATUS_CLS: Record<PurchaseOrderStatus, string> = {
  PENDING:          "bg-tan/60 text-brown",
  AWAITING_PAYMENT: "bg-[#f2e8c8] text-[#8a7030]",
  CONFIRMED:        "bg-[#dce6d8] text-[#4e7048]",
  CANCELLED:        "bg-[#eedede] text-[#904545]",
};

function formatId(id: string) {
  return `#INF-${id.slice(-4).toUpperCase()}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminDashboardTable({ orders }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <tr>
        <td colSpan={6} className="py-16 text-center font-serif text-xl text-muted-foreground">
          No hay pedidos registrados todavía.
        </td>
      </tr>
    );
  }

  return (
    <>
      {orders.map((o) => {
        const isOpen = openId === o.id;

        return (
          <Fragment key={o.id}>
            <tr className="border-b border-tan/60 hover:bg-tan/20 transition-colors">
              <td className="py-4 text-sm text-brown">{formatId(o.id)}</td>
              <td className="py-4 text-sm text-brown">{o.userName}</td>
              <td className="py-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(o.createdAt)}</td>
              <td className="py-4">
                <button
                  onClick={() => setOpenId(isOpen ? null : o.id)}
                  className={`text-xs underline underline-offset-2 transition-colors whitespace-nowrap ${isOpen ? "text-brown" : "text-brown/50 hover:text-brown"}`}
                >
                  ver lista de productos
                </button>
              </td>
              <td className="py-4 text-sm font-medium text-brown">{o.total}</td>
              <td className="py-4">
                <span className={`px-3 py-1 rounded-full text-xs tracking-widest ${STATUS_CLS[o.status]}`}>
                  {STATUS_LABEL[o.status]}
                </span>
              </td>
            </tr>

            {isOpen && (
              <tr className="border-b border-tan/60">
                <td colSpan={6} className="px-0 py-0">
                  <div className="border-l-2 border-terracotta mx-6 my-3 w-72">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-tan/60">
                          <th className="pl-4 pr-3 py-2 text-left text-[10px] tracking-[0.12em] text-terracotta font-normal">PRODUCTO</th>
                          <th className="pl-3 pr-4 py-2 text-center text-[10px] tracking-[0.12em] text-terracotta font-normal">CANT.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {o.items.map((item, i) => (
                          <tr key={i} className={i < o.items.length - 1 ? "border-b border-tan/40" : ""}>
                            <td className="pl-4 pr-3 py-2 text-xs text-brown">{item.productName}</td>
                            <td className="pl-3 pr-4 py-2 text-xs text-muted-foreground text-center">×{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            )}
          </Fragment>
        );
      })}
    </>
  );
}
