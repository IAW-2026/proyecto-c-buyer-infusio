import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/lib/prisma";
import { createPurchaseOrder, CartItemPayload } from "@/app/lib/services/externalApis";

interface AddressBody {
  email?: string;
  firstName?: string;
  lastName?: string;
  street: string;
  apartment?: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
  note?: string;
  [key: string]: string | undefined;
}

export async function POST(request: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { address: AddressBody };
  const { address } = body;

  if (!address?.street || !address?.city || !address?.province || !address?.postalCode) {
    return NextResponse.json({ error: "Complete shipping address is required" }, { status: 400 });
  }

  const cart = await db.cart.findFirst({
    where: { userId, status: "NOT_CHECKED_OUT" },
    include: { items: true },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const cartItems: CartItemPayload[] = cart.items.map((item) => ({
    product_id: item.productId,
    product_name: item.productName,
    product_variant: item.productVariant ?? null,
    product_image_url: item.productImageUrl ?? null,
    unit_price: Number(item.priceAtTime),
    quantity: item.quantity,
    subtotal: Number(item.priceAtTime) * item.quantity,
  }));

  // Map address to snake_case for seller; omit any `id` field that might leak in
  const { postalCode, id: _id, ...rest } = address as AddressBody & { id?: string };
  const sellerAddress: Record<string, string | undefined> = { ...rest, postal_code: postalCode };

  const token = await getToken();

  const order = await createPurchaseOrder(userId, cart.id, sellerAddress, cartItems, token ?? undefined);

  await db.cart.update({
    where: { id: cart.id },
    data: { status: "CHECKED_OUT" },
  });

  return NextResponse.json({
    purchase_order_id: order.purchase_order_id,
    shipping_cost: order.shipping_cost,
    currency: order.currency,
    payment_url: order.payment_url,
  });
}
