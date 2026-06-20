import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/lib/prisma";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cartId } = (await request.json()) as { cartId?: string };
  if (!cartId) return NextResponse.json({ error: "cartId required" }, { status: 400 });

  const oldCart = await db.cart.findFirst({
    where: { id: cartId, userId, status: "CHECKED_OUT" },
    include: { items: true },
  });
  if (!oldCart) return NextResponse.json({ error: "Cart not found or already restored" }, { status: 400 });

  let newCart = await db.cart.findFirst({ where: { userId, status: "NOT_CHECKED_OUT" } });
  if (!newCart) {
    newCart = await db.cart.create({ data: { userId } });
  }

  for (const item of oldCart.items) {
    const existing = await db.cartItem.findUnique({
      where: { cartId_productId: { cartId: newCart.id, productId: item.productId } },
    });
    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      });
    } else {
      await db.cartItem.create({
        data: {
          cartId: newCart.id,
          productId: item.productId,
          productName: item.productName,
          productVariant: item.productVariant,
          productImageUrl: item.productImageUrl,
          priceAtTime: item.priceAtTime,
          quantity: item.quantity,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}
