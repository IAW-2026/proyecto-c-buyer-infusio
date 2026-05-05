import { NextRequest, NextResponse } from "next/server";

// Mock endpoint — mirrors POST /api/seller/purchase_order from the Seller App contract.
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { shopping_cart_id, user_id } = body as {
    shopping_cart_id: string;
    user_id: string;
  };

  if (!shopping_cart_id || !user_id) {
    return NextResponse.json(
      { error: "shopping_cart_id and user_id are required" },
      { status: 400 }
    );
  }

  const purchase_order_id = `mock_order_${Date.now()}`;

  return NextResponse.json({ purchase_order_id }, { status: 201 });
}
