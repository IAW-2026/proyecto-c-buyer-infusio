import { NextResponse } from "next/server";
import { db } from "@/app/lib/prisma";
import type { SellerProduct } from "@/app/lib/services/externalApis";

// Mock endpoint — mirrors GET /api/seller/product/{id} from the Seller App contract.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const p = await db.product.findUnique({ where: { id } });

  if (!p) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const product: SellerProduct = {
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
  };

  return NextResponse.json({ product });
}
