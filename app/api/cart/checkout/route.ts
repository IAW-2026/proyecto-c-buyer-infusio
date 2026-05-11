import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/lib/prisma";
import { createPurchaseOrder, OrderItem } from "@/app/lib/services/externalApis";

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

  const orderItems: OrderItem[] = cart.items.map((item) => ({
    product_id: item.productId,
    product_name: item.productName,
    unit_price: Number(item.priceAtTime),
    quantity: item.quantity,
    subtotal: Number(item.priceAtTime) * item.quantity,
  }));

  const token = await getToken();

  const { purchase_order_id, shipping_cost, currency, checkout_url } =
    await createPurchaseOrder(userId, address as unknown as Record<string, string | undefined>, orderItems, token ?? undefined);

  await db.purchaseOrder.create({
    data: {
      cartId: cart.id,
      userId,
      userAddress: address as object,
      status: "PENDING",
    },
  });

  await db.cart.update({
    where: { id: cart.id },
    data: { status: "CHECKED_OUT" },
  });

  return NextResponse.json({ purchase_order_id, shipping_cost, currency, checkout_url });
}
