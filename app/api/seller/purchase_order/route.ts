import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/prisma";

// Mock endpoint — mirrors POST /api/seller/purchase_order from the Seller App contract.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, shopping_cart_id, cart_items, address } = body as {
    user_id: string;
    shopping_cart_id: string;
    cart_items: Array<{
      product_id: string;
      product_name: string;
      product_variant: string | null;
      product_image_url: string | null;
      unit_price: number;
      quantity: number;
      subtotal: number;
    }>;
    address: Record<string, string | undefined>;
  };

  if (!user_id || !shopping_cart_id || !cart_items?.length || !address) {
    return NextResponse.json(
      { error: "user_id, shopping_cart_id, cart_items, and address are required" },
      { status: 400 }
    );
  }

  const subtotal = cart_items.reduce((s, i) => s + i.subtotal, 0);

  const destNum = parseInt(address?.postal_code ?? "1000", 10);
  const diff = Math.abs(destNum - 1000);
  const shipping_cost = diff > 3000 ? 4200 : diff > 1000 ? 2800 : 1500;
  const total = subtotal + shipping_cost;

  // Create the order first so we have its ID for the payment URL
  const order = await db.purchaseOrder.create({
    data: {
      cartId: shopping_cart_id,
      userId: user_id,
      userAddress: address as object,
      status: "PENDING",
      paymentUrl: "",
      packages: {
        create: {
          sellerId: "mock-seller",
          buyerId: user_id,
          amount: subtotal,
          shippingCost: shipping_cost,
          items: {
            create: cart_items.map((item) => ({
              productId: item.product_id,
              productName: item.product_name,
              unitPrice: item.unit_price,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
      },
    },
  });

  const origin = new URL(request.url).origin;
  const payment_url = `${origin}/api/payments/payment-url?order_id=${order.id}&amount=${total}`;

  await db.purchaseOrder.update({
    where: { id: order.id },
    data: { paymentUrl: payment_url },
  });

  return NextResponse.json(
    {
      purchase_order_id: order.id,
      user_id: order.userId,
      shopping_cart_id: order.cartId,
      status: order.status,
      created_at: order.createdAt.toISOString(),
      shipping_id: null,
      payment_id: null,
      payment_url,
      shipping_cost,
      currency: "ARS",
      address,
      cart_items: cart_items.map((item, idx) => ({
        id: `item-${idx}`,
        cart_id: shopping_cart_id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_variant: item.product_variant ?? null,
        product_image_url: item.product_image_url ?? null,
        price_at_time: item.unit_price,
        quantity: item.quantity,
      })),
    },
    { status: 201 }
  );
}
