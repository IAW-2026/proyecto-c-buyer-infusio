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
  const user = await db.user.findUnique({
    where: { id },
    include: {
      carts: { select: { id: true, status: true, createdAt: true, _count: { select: { items: true } } } },
      _count: { select: { purchaseOrders: true, favouriteProducts: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateControlKey(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const { name, lastName, email, phoneNumber, roles } = body as {
    name?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    roles?: string[];
  };

  const user = await db.user.update({
    where: { id },
    data: {
      ...(name        !== undefined && { name }),
      ...(lastName    !== undefined && { lastName }),
      ...(email       !== undefined && { email }),
      ...(phoneNumber !== undefined && { phoneNumber }),
      ...(roles       !== undefined && { roles: roles as never[] }),
    },
  }).catch(() => null);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateControlKey(req);
  if (authError) return authError;

  const { id } = await params;
  const result = await db.user.deleteMany({ where: { id } });

  if (result.count === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
