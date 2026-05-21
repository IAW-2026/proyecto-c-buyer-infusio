import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/lib/prisma";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await db.purchaseOrder.findFirst({
    where: { id, userId, status: "PENDING" },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.purchaseOrder.update({
    where: { id },
    data: { status: "AWAITING_PAYMENT" },
  });
  return NextResponse.json({ success: true });
}
