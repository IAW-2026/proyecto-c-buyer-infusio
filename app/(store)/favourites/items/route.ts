import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/app/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ items: [] });

  const rows = await db.favouriteProduct.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      productImageUrl: r.productImageUrl,
      price: r.price,
      location: r.location,
      categories: r.categories,
      description: r.description,
    })),
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, productName, productImageUrl, price, location, categories, description } =
    await req.json();

  await db.favouriteProduct.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId, productName, productImageUrl: productImageUrl ?? null, price, location: location ?? null, categories: categories ?? [], description: description ?? null },
    update: { productName, productImageUrl: productImageUrl ?? null, price, location: location ?? null, categories: categories ?? [], description: description ?? null },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  if (searchParams.get("all") === "true") {
    await db.favouriteProduct.deleteMany({ where: { userId } });
    return NextResponse.json({ ok: true });
  }

  const productId = searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

  await db.favouriteProduct.delete({
    where: { userId_productId: { userId, productId } },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
