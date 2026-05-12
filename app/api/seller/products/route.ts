import { NextResponse } from "next/server";
import { db } from "@/app/lib/prisma";
import type { SellerProduct } from "@/app/lib/services/externalApis";

// Mock endpoint — mirrors GET /api/seller/products from the Seller App contract.
// Active in dev when SELLER_API_URL=http://localhost:3000.
// Returns 404 in production to prevent accidental exposure.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await db.product.findMany({ orderBy: { name: "asc" } });

  const products: SellerProduct[] = rows.map((p) => ({
    id: p.id,
    sellerId: p.sellerId,
    name: p.name,
    description: p.description,
    categories: p.categories,
    price: Number(p.price),
    stock: p.stock,
    unit: p.unit,
    imageUrl: p.imageUrl,
    location: p.location ?? undefined,
    isLimitedEdition: p.isLimitedEdition,
    badge: p.badge ?? undefined,
    colors: p.colors,
    specs: p.specs as SellerProduct["specs"] ?? undefined,
  }));

  return NextResponse.json({ products });
}
