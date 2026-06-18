import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/lib/prisma";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cartId } = (await request.json()) as { cartId?: string };
  if (!cartId) return NextResponse.json({ error: "cartId required" }, { status: 400 });

  await db.cart.updateMany({
    where: { id: cartId, userId, status: { in: ["NOT_CHECKED_OUT", "CHECKOUT_PENDING"] } },
    data: { status: "CHECKED_OUT" },
  });

  return NextResponse.json({ ok: true });
}
