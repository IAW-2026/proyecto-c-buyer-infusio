import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/prisma";

// Mock endpoint — mirrors GET /api/seller/purchase_orders/{id} from the Seller App contract.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await db.purchaseOrder.findUnique({
    where: { id },
    include: {
      packages: { include: { items: true } },
      cart: { include: { items: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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

  return NextResponse.json({
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
  });
}
