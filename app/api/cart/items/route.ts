import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cart = await db.cart.findFirst({
    where: { userId, status: "NOT_CHECKED_OUT" },
    include: { items: true },
  });

  return NextResponse.json({ items: cart?.items ?? [] });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { productId, productName, productImageUrl, priceAtTime, quantity = 1 } = body as {
    productId: string;
    productName: string;
    productImageUrl?: string;
    priceAtTime: number;
    quantity?: number;
  };

  if (!productId || !productName || priceAtTime === undefined) {
    return NextResponse.json({ error: "productId, productName and priceAtTime are required" }, { status: 400 });
  }

  // Ensure the User row exists — may not yet if the Clerk webhook hasn't fired
  const clerkUser = await currentUser();
  await db.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      name: clerkUser?.firstName ?? "—",
      lastName: clerkUser?.lastName ?? "—",
      email: clerkUser?.emailAddresses[0]?.emailAddress ?? `${userId}@unknown`,
    },
    update: {},
  });

  // Find or create the active cart
  let cart = await db.cart.findFirst({
    where: { userId, status: "NOT_CHECKED_OUT" },
  });
  if (!cart) {
    cart = await db.cart.create({ data: { userId } });
  }

  // Upsert the cart item (increment if already present)
  const existing = await db.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        productName,
        productImageUrl: productImageUrl ?? null,
        priceAtTime,
        quantity,
      },
    });
  }

  return NextResponse.json({ success: true });
}
