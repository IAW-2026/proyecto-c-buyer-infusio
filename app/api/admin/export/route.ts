export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import PDFDocument from "pdfkit";
import { db } from "@/app/lib/prisma";
import type { PurchaseOrderStatus } from "@/generated/prisma/client";

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
  const byStatus = Object.fromEntries(statusGroups.map((s) => [s.status, s._count.id])) as Partial<Record<PurchaseOrderStatus, number>>;

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

    const csv = rows.join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="infusio-datos-${generatedOn.replace(/\//g, "-")}.csv"`,
      },
    });
  }

  // ─── PDF ──────────────────────────────────────────────────────────────────

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const PAGE_W = doc.page.width - 100; // usable width (margins 50 each side)
    const TERRACOTTA = "#9b6a5a";
    const CREAM_ROW = "#f5f0e8";
    const BROWN = "#3d2e21";
    const MUTED = "#8c7a6b";

    // ── Header ──
    doc.fillColor(BROWN).font("Helvetica-Bold").fontSize(24).text("INFUSIO", 50, 50);
    doc.fillColor(MUTED).font("Helvetica").fontSize(10).text("Reporte de Ventas", 50, 80);
    doc.fillColor(MUTED).fontSize(9).text(`Generado el ${generatedOn}`, 50, 94, { align: "right", width: PAGE_W });

    doc.moveTo(50, 115).lineTo(50 + PAGE_W, 115).strokeColor("#d6c9b8").lineWidth(0.5).stroke();

    // ── Summary ──
    const summaryY = 130;
    doc.fillColor(BROWN).font("Helvetica-Bold").fontSize(9).text("INGRESOS TOTALES (ARS)", 50, summaryY);
    doc.fillColor(BROWN).font("Helvetica").fontSize(18).text(
      `$${totalRevenue.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`,
      50, summaryY + 14
    );

    const col2 = 50 + PAGE_W / 2;
    doc.fillColor(BROWN).font("Helvetica-Bold").fontSize(9).text("PEDIDOS POR ESTADO", col2, summaryY);
    doc.fillColor(MUTED).font("Helvetica").fontSize(9)
      .text(`Procesando: ${byStatus.PENDING ?? 0}`, col2, summaryY + 14)
      .text(`Confirmado: ${byStatus.CONFIRMED ?? 0}`, col2, summaryY + 26)
      .text(`Cancelado: ${byStatus.CANCELLED ?? 0}`, col2, summaryY + 38)
      .text(`Últimos 30 días: ${recentCount}`, col2, summaryY + 50);

    const tableY = summaryY + 80;
    doc.moveTo(50, tableY - 8).lineTo(50 + PAGE_W, tableY - 8).strokeColor("#d6c9b8").lineWidth(0.5).stroke();

    // ── Table ──
    const cols = [
      { label: "ORDER ID",  w: 68 },
      { label: "CLIENTE",   w: 100 },
      { label: "FECHA",     w: 62 },
      { label: "PRODUCTOS", w: 150 },
      { label: "TOTAL",     w: 68 },
      { label: "ESTADO",    w: 80 },
    ];

    // header row
    doc.rect(50, tableY, PAGE_W, 18).fill(TERRACOTTA);
    let cx = 50;
    for (const col of cols) {
      doc.fillColor("white").font("Helvetica-Bold").fontSize(7.5)
        .text(col.label, cx + 4, tableY + 5, { width: col.w - 6, ellipsis: true });
      cx += col.w;
    }

    let rowY = tableY + 18;
    const ROW_H = 20;

    for (let idx = 0; idx < orders.length; idx++) {
      const o = orders[idx];
      if (rowY + ROW_H > doc.page.height - 60) {
        doc.addPage();
        rowY = 50;
      }

      if (idx % 2 === 0) doc.rect(50, rowY, PAGE_W, ROW_H).fill(CREAM_ROW);

      const productos = o.cart.items.map((i) => `${i.productName} x${i.quantity}`).join(", ");
      const total = o.packages.reduce((s, p) => s + Number(p.amount), 0);

      const cells = [
        `#INF-${o.id.slice(-4).toUpperCase()}`,
        `${o.user.name} ${o.user.lastName}`.trim(),
        formatDate(o.createdAt),
        productos,
        `$${total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`,
        STATUS_LABEL[o.status],
      ];

      cx = 50;
      for (let ci = 0; ci < cols.length; ci++) {
        doc.fillColor(BROWN).font("Helvetica").fontSize(7.5)
          .text(cells[ci], cx + 4, rowY + 6, { width: cols[ci].w - 8, ellipsis: true });
        cx += cols[ci].w;
      }
      rowY += ROW_H;
    }

    // ── Footer with page numbers ──
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.fillColor(MUTED).font("Helvetica").fontSize(8)
        .text(`Página ${i + 1} de ${range.count}`, 50, doc.page.height - 40, { align: "center", width: PAGE_W });
    }

    doc.end();
  });

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="infusio-reporte-${generatedOn.replace(/\//g, "-")}.pdf"`,
    },
  });
}
