import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/prisma";

// Mock endpoint — mirrors GET /api/seller/purchase_orders?user_id=X from the Seller App contract.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  const orders = await db.purchaseOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      packages: { include: { items: true } },
      cart: { include: { items: true } },
    },
  });

  const result = orders.map((order) => {
    const address = order.userAddress as Record<string, string | undefined>;
    const shippingCost = order.packages.reduce((s, p) => s + Number(p.shippingCost), 0);

    // New orders have PackageItems; old orders fall back to CartItems
    const cartItems = order.packages.length > 0
      ? order.packages.flatMap((p) =>
          p.items.map((item) => ({
            id: item.id,
            cart_id: order.cartId,
            product_id: item.productId,
            product_name: item.productName,
            product_variant: null as string | null,
            product_image_url: null as string | null,
            price_at_time: Number(item.unitPrice),
            quantity: item.quantity,
          }))
        )
      : order.cart.items.map((item) => ({
          id: item.id,
          cart_id: order.cartId,
          product_id: item.productId,
          product_name: item.productName,
          product_variant: item.productVariant ?? null,
          product_image_url: item.productImageUrl ?? null,
          price_at_time: Number(item.priceAtTime),
          quantity: item.quantity,
        }));

    return {
      purchase_order_id: order.id,
      user_id: order.userId,
      shopping_cart_id: order.cartId,
      status: order.status,
      created_at: order.createdAt.toISOString(),
      shipping_id: order.shippingId ?? null,
      payment_id: order.paymentId ?? null,
      payment_url: order.paymentUrl ?? "",
      shipping_cost: shippingCost,
      currency: "ARS",
      address,
      cart_items: cartItems,
    };
  });

  return NextResponse.json({ orders: result });
}
