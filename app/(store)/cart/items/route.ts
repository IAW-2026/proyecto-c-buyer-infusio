import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/app/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Auto-recover any CHECKOUT_PENDING sub-carts the user abandoned (e.g. by logging out
  // mid-checkout). Their items are merged back into the NOT_CHECKED_OUT cart.
  const pendingCarts = await db.cart.findMany({
    where: { userId, status: "CHECKOUT_PENDING" },
    include: { items: true },
  });

  if (pendingCarts.length > 0) {
    let mainCart = await db.cart.findFirst({
      where: { userId, status: "NOT_CHECKED_OUT" },
    });
    if (!mainCart) {
      mainCart = await db.cart.create({ data: { userId } });
    }

    for (const pendingCart of pendingCarts) {
      for (const item of pendingCart.items) {
        const existing = await db.cartItem.findUnique({
          where: { cartId_productId: { cartId: mainCart.id, productId: item.productId } },
        });
        if (existing) {
          await db.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + item.quantity },
          });
        } else {
          await db.cartItem.create({
            data: {
              cartId: mainCart.id,
              productId: item.productId,
              sellerId: item.sellerId,
              productName: item.productName,
              productVariant: item.productVariant,
              productImageUrl: item.productImageUrl,
              priceAtTime: item.priceAtTime,
              quantity: item.quantity,
            },
          });
        }
      }
      await db.cart.delete({ where: { id: pendingCart.id } });
    }
  }

  const cart = await db.cart.findFirst({
    where: { userId, status: "NOT_CHECKED_OUT" },
    include: { items: true },
  });

  const items = (cart?.items ?? []).map((item) => ({
    ...item,
    priceAtTime: item.priceAtTime.toNumber(),
  }));
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { productId, productName, productVariant, productImageUrl, priceAtTime, quantity = 1, sellerId } = body as {
    productId: string;
    productName: string;
    productVariant?: string;
    productImageUrl?: string;
    priceAtTime: number;
    quantity?: number;
    sellerId?: string;
  };

  if (!productId || !productName || priceAtTime === undefined) {
    return NextResponse.json({ error: "productId, productName and priceAtTime are required" }, { status: 400 });
  }

  // Ensure the User row exists — may not yet if the Clerk webhook hasn't fired.
  const existingUser = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!existingUser) {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? `${userId}@unknown`;
    const name = clerkUser?.firstName ?? "—";
    const lastName = clerkUser?.lastName ?? "—";

    await db.$transaction(async (tx) => {
      await tx.user.deleteMany({ where: { email, NOT: { id: userId } } });
      await tx.user.upsert({
        where: { id: userId },
        create: { id: userId, name, lastName, email },
        update: {},
      });
    });
  }

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
        sellerId: sellerId ?? null,
        productName,
        productVariant: productVariant ?? null,
        productImageUrl: productImageUrl ?? null,
        priceAtTime,
        quantity,
      },
    });
  }

  return NextResponse.json({ success: true });
}
