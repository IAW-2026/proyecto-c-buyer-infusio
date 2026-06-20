import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/prisma";
import { validateControlKey } from "../_auth";

export async function GET(req: NextRequest) {
  const authError = validateControlKey(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));

  const where = {
    ...(userId && { userId }),
    ...(status && { status: status as never }),
  };

  const [carts, total] = await Promise.all([
    db.cart.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: { select: { id: true, productId: true, productName: true, quantity: true, priceAtTime: true } },
        user:  { select: { id: true, name: true, lastName: true, email: true } },
      },
    }),
    db.cart.count({ where }),
  ]);

  const serialized = carts.map((c) => ({
    ...c,
    subtotal: c.subtotal?.toNumber() ?? null,
    items: c.items.map((i) => ({ ...i, priceAtTime: i.priceAtTime.toNumber() })),
  }));

  return NextResponse.json({ carts: serialized, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const authError = validateControlKey(req);
  if (authError) return authError;

  const body = await req.json();
  const { userId } = body as { userId: string };

  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const cart = await db.cart.create({ data: { userId } });
  return NextResponse.json({ cart }, { status: 201 });
}
