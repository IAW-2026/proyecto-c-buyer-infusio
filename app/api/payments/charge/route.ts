import { NextRequest, NextResponse } from "next/server";

// Mock endpoint — mirrors POST /api/payments/charge from the Payments App contract.
// This is called by the Seller App (not Buyer App directly), but mocking it here
// allows the full checkout flow to work when PAYMENTS_API_URL points to localhost:3000.
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { seller_app_order_id, buyer_id, amount } = body as {
    seller_app_id: string;
    seller_app_order_id: string;
    buyer_app_id: string;
    buyer_id: string;
    amount: number;
  };

  if (!seller_app_order_id || !buyer_id || amount == null) {
    return NextResponse.json(
      { error: "seller_app_order_id, buyer_id, and amount are required" },
      { status: 400 }
    );
  }

  const payment_order_id = `mock_pay_${Date.now()}`;

  // The checkout_url in production would be a Mercado Pago URL.
  // In mock mode it points to a local simulation route.
  const checkout_url = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/payments/mock-complete?payment_order_id=${payment_order_id}&amount=${amount}`;

  return NextResponse.json({ payment_order_id, checkout_url }, { status: 201 });
}
