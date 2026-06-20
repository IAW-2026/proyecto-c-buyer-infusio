import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/app/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { items } = await req.json();

  const share = await db.favouriteShare.create({
    data: { userId, items },
  });

  return NextResponse.json({ token: share.id });
}
