import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { createPurchaseOrder, getPaymentUrl } from "@/lib/services/externalApis";

interface AddressBody {
  street: string;
  city: string;
  province: string;
  postalCode: string;
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

  const token = await getToken();

  const { purchase_order_id } = await createPurchaseOrder(cart.id, userId, token ?? undefined);

  const { checkout_url } = await getPaymentUrl(purchase_order_id, token ?? undefined);

  await db.purchaseOrder.create({
    data: {
      cartId: cart.id,
      userId,
      userAddress: address,
      status: "PENDING",
    },
  });

  await db.cart.update({
    where: { id: cart.id },
    data: { status: "CHECKED_OUT" },
  });

  return NextResponse.json({ checkout_url });
}
