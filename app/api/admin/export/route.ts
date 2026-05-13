export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/lib/prisma";
import type { PurchaseOrderStatus } from "@/generated/prisma/client";
import {
  renderToBuffer,
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import React from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function csvEscape(value: string | number | null | undefined): string {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  PENDING:   "PROCESANDO",
  CONFIRMED: "CONFIRMADO",
  CANCELLED: "CANCELADO",
};

// ─── PDF styles ───────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page:       { fontFamily: "Helvetica", fontSize: 9, color: "#2d2926", padding: "1.8cm", backgroundColor: "#ffffff" },
  // header
  header:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  brand:      { fontSize: 20, letterSpacing: 3 },
  brandSub:   { fontSize: 7, letterSpacing: 2, color: "#8a8278", marginTop: 3 },
  reportTitle:{ fontSize: 11, textAlign: "right" },
  reportDate: { fontSize: 7, color: "#8a8278", textAlign: "right", marginTop: 3, letterSpacing: 1 },
  hr:         { borderBottomWidth: 0.5, borderBottomColor: "#d4cfc5", marginVertical: 14 },
  // summary
  summaryRow: { flexDirection: "row", gap: 24, marginBottom: 20 },
  summaryBlock:{ flex: 1, borderWidth: 0.5, borderColor: "#d4cfc5", padding: "10 12" },
  summaryLabel:{ fontSize: 6, letterSpacing: 3, color: "#8a8278", marginBottom: 5, fontFamily: "Helvetica-Bold" },
  summaryValue:{ fontSize: 18, color: "#2d2926" },
  summarySmall:{ fontSize: 8, color: "#5a5450", marginTop: 2 },
  // table
  tableHead:  { flexDirection: "row", backgroundColor: "#2d2926", paddingVertical: 6 },
  tableHeadCell: { fontSize: 6.5, letterSpacing: 1.5, color: "#f5f3ef", fontFamily: "Helvetica-Bold", paddingHorizontal: 5 },
  tableRow:   { flexDirection: "row", paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: "#ede9e3" },
  tableRowAlt:{ flexDirection: "row", paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: "#ede9e3", backgroundColor: "#faf8f5" },
  cell:       { fontSize: 7.5, color: "#2d2926", paddingHorizontal: 5 },
  cellMuted:  { fontSize: 7.5, color: "#8a8278", paddingHorizontal: 5 },
  // footer
  footer:     { marginTop: 24, borderTopWidth: 0.5, borderTopColor: "#d4cfc5", paddingTop: 10, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#8a8278", letterSpacing: 0.5 },
});

// Column widths (points, must sum to usable page width ~480 for A4 with 1.8cm margins)
const COLS = [
  { label: "ORDER ID",  w: 56 },
  { label: "CLIENTE",   w: 86 },
  { label: "EMAIL",     w: 110 },
  { label: "FECHA",     w: 54 },
  { label: "TOTAL",     w: 54 },
  { label: "ESTADO",    w: 72 },
  { label: "PRODUCTOS", w: 0 }, // flex: 1
];

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId }, select: { roles: true } });
  if (!user?.roles.includes("ADMIN")) return new Response("Forbidden", { status: 403 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [orders, revAgg, statusGroups, recentCount] = await Promise.all([
    db.purchaseOrder.findMany({
      include: {
        user: { select: { name: true, lastName: true, email: true } },
        cart: { include: { items: { select: { productName: true, quantity: true } } } },
        packages: { select: { amount: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.package.aggregate({ _sum: { amount: true } }),
    db.purchaseOrder.groupBy({ by: ["status"], _count: { id: true } }),
    db.purchaseOrder.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  const totalRevenue = Number(revAgg._sum.amount ?? 0);
  const totalOrders = orders.length;
  const byStatus = Object.fromEntries(
    statusGroups.map((s) => [s.status, s._count.id])
  ) as Partial<Record<PurchaseOrderStatus, number>>;

  const format = request.nextUrl.searchParams.get("format") ?? "csv";
  const generatedOn = formatDate(new Date());

  // ─── CSV ──────────────────────────────────────────────────────────────────

  if (format === "csv") {
    const rows: string[] = [];
    rows.push([csvEscape("INFUSIO — Reporte de Ventas"), csvEscape(`Generado el ${generatedOn}`)].join(","));
    rows.push([csvEscape("Ingresos totales (ARS)"), csvEscape(totalRevenue.toLocaleString("es-AR", { minimumFractionDigits: 2 }))].join(","));
    rows.push([csvEscape("Total pedidos"), csvEscape(totalOrders)].join(","));
    rows.push([
      csvEscape("Procesando"), csvEscape(byStatus.PENDING ?? 0),
      csvEscape("Confirmado"), csvEscape(byStatus.CONFIRMED ?? 0),
      csvEscape("Cancelado"), csvEscape(byStatus.CANCELLED ?? 0),
    ].join(","));
    rows.push([csvEscape("Últimos 30 días"), csvEscape(recentCount)].join(","));
    rows.push("");
    rows.push(["ORDER ID","CLIENTE","EMAIL","FECHA","PRODUCTOS","TOTAL","ESTADO","ID ENVÍO"].map(csvEscape).join(","));
    for (const o of orders) {
      const productos = o.cart.items.map((i) => `${i.productName} x${i.quantity}`).join(", ");
      const total = o.packages.reduce((s, p) => s + Number(p.amount), 0);
      rows.push([
        csvEscape(`#INF-${o.id.slice(-4).toUpperCase()}`),
        csvEscape(`${o.user.name} ${o.user.lastName}`.trim()),
        csvEscape(o.user.email),
        csvEscape(formatDate(o.createdAt)),
        csvEscape(productos),
        csvEscape(total.toLocaleString("es-AR", { minimumFractionDigits: 2 })),
        csvEscape(STATUS_LABEL[o.status]),
        csvEscape(o.shippingId ?? ""),
      ].join(","));
    }
    return new Response(rows.join("\r\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="infusio-datos-${generatedOn.replace(/\//g, "-")}.csv"`,
      },
    });
  }

  // ─── PDF ──────────────────────────────────────────────────────────────────

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", orientation: "landscape", style: s.page },

      // Header
      React.createElement(
        View,
        { style: s.header },
        React.createElement(View, null,
          React.createElement(Text, { style: s.brand }, "INFUSIO"),
          React.createElement(Text, { style: s.brandSub }, "REPORTE DE VENTAS")
        ),
        React.createElement(View, null,
          React.createElement(Text, { style: s.reportTitle }, "Reporte Administrativo"),
          React.createElement(Text, { style: s.reportDate }, `Generado el ${generatedOn}`)
        )
      ),

      React.createElement(View, { style: s.hr }),

      // Summary tiles
      React.createElement(
        View,
        { style: s.summaryRow },
        React.createElement(View, { style: s.summaryBlock },
          React.createElement(Text, { style: s.summaryLabel }, "INGRESOS TOTALES (ARS)"),
          React.createElement(Text, { style: s.summaryValue }, `$${totalRevenue.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`)
        ),
        React.createElement(View, { style: s.summaryBlock },
          React.createElement(Text, { style: s.summaryLabel }, "TOTAL PEDIDOS"),
          React.createElement(Text, { style: s.summaryValue }, String(totalOrders)),
          React.createElement(Text, { style: s.summarySmall }, `${recentCount} en los últimos 30 días`)
        ),
        React.createElement(View, { style: s.summaryBlock },
          React.createElement(Text, { style: s.summaryLabel }, "POR ESTADO"),
          React.createElement(Text, { style: s.summarySmall }, `Procesando: ${byStatus.PENDING ?? 0}`),
          React.createElement(Text, { style: s.summarySmall }, `Confirmado: ${byStatus.CONFIRMED ?? 0}`),
          React.createElement(Text, { style: s.summarySmall }, `Cancelado: ${byStatus.CANCELLED ?? 0}`)
        )
      ),

      // Table header
      React.createElement(
        View,
        { style: s.tableHead },
        ...COLS.slice(0, -1).map((col) =>
          React.createElement(Text, { key: col.label, style: { ...s.tableHeadCell, width: col.w } }, col.label)
        ),
        React.createElement(Text, { style: { ...s.tableHeadCell, flex: 1 } }, "PRODUCTOS")
      ),

      // Rows
      ...orders.map((o, idx) => {
        const productos = o.cart.items.map((i) => `${i.productName} x${i.quantity}`).join("  ·  ");
        const total = o.packages.reduce((sum, p) => sum + Number(p.amount), 0);
        const rowStyle = idx % 2 === 0 ? s.tableRow : s.tableRowAlt;
        return React.createElement(
          View,
          { key: o.id, style: rowStyle },
          React.createElement(Text, { style: { ...s.cell, width: COLS[0].w } }, `#INF-${o.id.slice(-4).toUpperCase()}`),
          React.createElement(Text, { style: { ...s.cell, width: COLS[1].w } }, `${o.user.name} ${o.user.lastName}`.trim()),
          React.createElement(Text, { style: { ...s.cellMuted, width: COLS[2].w } }, o.user.email),
          React.createElement(Text, { style: { ...s.cellMuted, width: COLS[3].w } }, formatDate(o.createdAt)),
          React.createElement(Text, { style: { ...s.cell, width: COLS[4].w } }, `$${total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`),
          React.createElement(Text, { style: { ...s.cell, width: COLS[5].w } }, STATUS_LABEL[o.status]),
          React.createElement(Text, { style: { ...s.cellMuted, flex: 1 } }, productos)
        );
      }),

      // Footer
      React.createElement(
        View,
        { style: s.footer },
        React.createElement(Text, { style: s.footerText }, "INFUSIO — Reporte interno. No distribuir."),
        React.createElement(Text, { style: s.footerText }, `Total: ${totalOrders} pedidos`)
      )
    )
  );

  const buffer = await renderToBuffer(doc);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="infusio-reporte-${generatedOn.replace(/\//g, "-")}.pdf"`,
    },
  });
}
