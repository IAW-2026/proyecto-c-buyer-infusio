import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/prisma";
import { validateControlKey } from "../../_auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateControlKey(req);
  if (authError) return authError;

  const { id } = await params;
  const cart = await db.cart.findUnique({
    where: { id },
    include: {
      items: true,
      user: { select: { id: true, name: true, lastName: true, email: true } },
    },
  });

  if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

  return NextResponse.json({
    cart: {
      ...cart,
      subtotal: cart.subtotal?.toNumber() ?? null,
      items: cart.items.map((i) => ({ ...i, priceAtTime: i.priceAtTime.toNumber() })),
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateControlKey(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const { status } = body as { status?: string };

  const cart = await db.cart.update({
    where: { id },
    data: { ...(status !== undefined && { status: status as never }) },
  }).catch(() => null);

  if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  return NextResponse.json({
    cart: { ...cart, subtotal: cart.subtotal?.toNumber() ?? null },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateControlKey(req);
  if (authError) return authError;

  const { id } = await params;
  const result = await db.cart.deleteMany({ where: { id } });

  if (result.count === 0) return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
