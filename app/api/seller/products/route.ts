import { NextResponse } from "next/server";
import { db } from "@/app/lib/prisma";
import type { SellerProduct } from "@/app/lib/services/externalApis";

// Mock endpoint — mirrors GET /api/seller/products from the Seller App contract.
export async function GET() {
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
  }));

  return NextResponse.json({ products });
}
