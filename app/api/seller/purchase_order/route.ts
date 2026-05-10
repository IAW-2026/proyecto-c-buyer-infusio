import { NextRequest, NextResponse } from "next/server";

// Mock endpoint — mirrors POST /api/seller/purchase_order from the Seller App contract.
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { user_id, address, items } = body as {
    user_id: string;
    address: Record<string, string | undefined>;
    items: Array<{ product_id: string; product_name: string; unit_price: number; quantity: number; subtotal: number }>;
  };

  if (!user_id || !address || !items?.length) {
    return NextResponse.json(
      { error: "user_id, address, and items are required" },
      { status: 400 }
    );
  }

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);

  const destNum = parseInt(address?.postalCode ?? "1000", 10);
  const diff = Math.abs(destNum - 1000);
  const shipping_cost = diff > 3000 ? 4200 : diff > 1000 ? 2800 : 1500;

  const total = subtotal + shipping_cost;
  const purchase_order_id = `mock_order_${Date.now()}`;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const checkout_url = `${APP_URL}/api/payments/payment-url?order_id=${purchase_order_id}&amount=${total}`;

  return NextResponse.json(
    { purchase_order_id, shipping_cost, currency: "ARS", checkout_url },
    { status: 201 }
  );
}
