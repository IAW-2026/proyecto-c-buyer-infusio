import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrderById } from "@/app/lib/services/externalApis";
import { renderToBuffer, Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#2d2926",
    padding: "2cm",
    backgroundColor: "#ffffff",
  },
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  brandName: { fontSize: 18, letterSpacing: 3, fontFamily: "Helvetica" },
  brandSub: { fontSize: 8, letterSpacing: 2, color: "#8a8278", marginTop: 4 },
  orderTitle: { fontSize: 15, textAlign: "right" },
  orderDate: { fontSize: 8, color: "#8a8278", textAlign: "right", marginTop: 4, letterSpacing: 1 },
  // Divider
  hr: { borderBottomWidth: 0.5, borderBottomColor: "#d4cfc5", marginVertical: 16 },
  // Billing/payment row
  metaRow: { flexDirection: "row", gap: 32, marginBottom: 32 },
  metaBlock: { flex: 1 },
  metaLabel: { fontSize: 7, letterSpacing: 3, color: "#8a8278", marginBottom: 6, fontFamily: "Helvetica-Bold" },
  metaText: { fontSize: 10, marginBottom: 2 },
  metaSubtext: { fontSize: 9, color: "#8a8278" },
  // Table header
  tableHeader: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "#d4cfc5" },
  colProduct: { flex: 1, fontSize: 7, letterSpacing: 2, color: "#8a8278", fontFamily: "Helvetica-Bold" },
  colQty: { width: 40, fontSize: 7, letterSpacing: 2, color: "#8a8278", textAlign: "right", fontFamily: "Helvetica-Bold" },
  colPrice: { width: 70, fontSize: 7, letterSpacing: 2, color: "#8a8278", textAlign: "right", fontFamily: "Helvetica-Bold" },
  colSubtotal: { width: 70, fontSize: 7, letterSpacing: 2, color: "#8a8278", textAlign: "right", fontFamily: "Helvetica-Bold" },
  // Table rows
  tableRow: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#ede9e3" },
  itemName: { flex: 1, fontSize: 10 },
  itemVariant: { flex: 1, fontSize: 8, color: "#8a8278", marginTop: 2 },
  itemQty: { width: 40, fontSize: 10, textAlign: "right" },
  itemPrice: { width: 70, fontSize: 10, textAlign: "right" },
  itemSubtotal: { width: 70, fontSize: 10, textAlign: "right" },
  // Totals
  totalsSection: { alignItems: "flex-end", marginTop: 20 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", width: 180, marginBottom: 6 },
  totalLabel: { fontSize: 7, letterSpacing: 2, color: "#8a8278", fontFamily: "Helvetica-Bold" },
  totalValue: { fontSize: 10 },
  grandTotalLabel: { fontSize: 7, letterSpacing: 2, color: "#2d2926", fontFamily: "Helvetica-Bold" },
  grandTotalValue: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  // Footer
  footer: { marginTop: 40, borderTopWidth: 0.5, borderTopColor: "#d4cfc5", paddingTop: 12 },
  footerText: { fontSize: 8, color: "#8a8278", textAlign: "center", letterSpacing: 1 },
});

const fmt = (n: number) =>
  "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2 });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId, getToken } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getToken();
  const order = await getOrderById(id, token ?? undefined).catch(() => null);

  if (!order || order.user_id !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const items = order.cart_items;
  const subtotal = items.reduce((s, i) => s + i.price_at_time * i.quantity, 0);
  const shippingCost = order.shipping_cost;
  const total = subtotal + shippingCost;

  const address = order.address;

  const orderDate = new Date(order.created_at).toLocaleDateString("es-AR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },

      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.brandName }, "INFUSIO"),
          React.createElement(Text, { style: styles.brandSub }, "CAFÉ · TÉ · INFUSIONES")
        ),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.orderTitle }, `Factura #IF-${order.purchase_order_id.slice(-4).toUpperCase()}`),
          React.createElement(Text, { style: styles.orderDate }, orderDate)
        )
      ),

      React.createElement(View, { style: styles.hr }),

      // Billing + payment
      React.createElement(
        View,
        { style: styles.metaRow },
        React.createElement(
          View,
          { style: styles.metaBlock },
          React.createElement(Text, { style: styles.metaLabel }, "FACTURADO A"),
          address?.firstName
            ? React.createElement(Text, { style: styles.metaText }, `${address.firstName} ${address.lastName ?? ""}`)
            : null,
          address?.street
            ? React.createElement(Text, { style: styles.metaSubtext }, `${address.street}${address.apartment ? `, ${address.apartment}` : ""}`)
            : null,
          address?.city
            ? React.createElement(Text, { style: styles.metaSubtext }, `${address.city}, ${address.province ?? ""} ${address.postal_code ?? ""}`)
            : null,
          address?.country
            ? React.createElement(Text, { style: styles.metaSubtext }, address.country)
            : null
        ),
        React.createElement(
          View,
          { style: styles.metaBlock },
          React.createElement(Text, { style: styles.metaLabel }, "MÉTODO DE PAGO"),
          React.createElement(Text, { style: styles.metaText }, "Mercado Pago"),
          order.payment_id
            ? React.createElement(Text, { style: styles.metaSubtext }, `Ref: ${order.payment_id}`)
            : null
        )
      ),

      React.createElement(View, { style: styles.hr }),

      // Table header
      React.createElement(
        View,
        { style: styles.tableHeader },
        React.createElement(Text, { style: styles.colProduct }, "PRODUCTO"),
        React.createElement(Text, { style: styles.colQty }, "CANT."),
        React.createElement(Text, { style: styles.colPrice }, "P. UNIT."),
        React.createElement(Text, { style: styles.colSubtotal }, "SUBTOTAL")
      ),

      // Items
      ...items.map((item) =>
        React.createElement(
          View,
          { key: item.id, style: styles.tableRow },
          React.createElement(
            View,
            { style: { flex: 1 } },
            React.createElement(Text, { style: styles.itemName }, item.product_name),
            item.product_variant
              ? React.createElement(Text, { style: styles.itemVariant }, item.product_variant)
              : null
          ),
          React.createElement(Text, { style: styles.itemQty }, String(item.quantity)),
          React.createElement(Text, { style: styles.itemPrice }, fmt(item.price_at_time)),
          React.createElement(Text, { style: styles.itemSubtotal }, fmt(item.price_at_time * item.quantity))
        )
      ),

      // Totals
      React.createElement(
        View,
        { style: styles.totalsSection },
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, "SUBTOTAL"),
          React.createElement(Text, { style: styles.totalValue }, fmt(subtotal))
        ),
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, "ENVÍO"),
          React.createElement(Text, { style: styles.totalValue }, shippingCost > 0 ? fmt(shippingCost) : "—")
        ),
        React.createElement(View, { style: { ...styles.hr, width: 180 } }),
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: styles.grandTotalLabel }, "TOTAL"),
          React.createElement(Text, { style: styles.grandTotalValue }, fmt(total))
        )
      ),

      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, { style: styles.footerText }, "INFUSIO · Este documento es un comprobante de compra.")
      )
    )
  );

  const buffer = await renderToBuffer(doc);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="factura-IF-${order.purchase_order_id.slice(-4).toUpperCase()}.pdf"`,
    },
  });
}
