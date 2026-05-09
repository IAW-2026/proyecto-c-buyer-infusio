import { NextResponse } from "next/server";

// Mock endpoint — mirrors GET /api/seller/orders/{id}/payment-url from the Seller App contract.
// In a real setup the Seller App would call Payments App to generate a Mercado Pago URL.
// Here we call our own local payments mock to simulate that flow.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Simulate what the Seller App would do: call Payments App to create a charge
  const paymentsUrl = process.env.PAYMENTS_API_URL ?? "http://localhost:3000/api/payments";

  let payment_order_id: string;
  let checkout_url: string;

  try {
    const res = await fetch(`${paymentsUrl}/charge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seller_app_id: "seller-app",
        seller_app_order_id: id,
        buyer_app_id: process.env.BUYER_APP_ID ?? "buyer-app",
        buyer_id: "mock_buyer",
        amount: 9999, // mock amount — real Seller App would compute from order
      }),
    });

    const data = await res.json();
    payment_order_id = data.payment_order_id;
    checkout_url = data.checkout_url;
  } catch {
    // Payments App unavailable — return a static mock
    payment_order_id = `mock_pay_${Date.now()}`;
    checkout_url = `http://localhost:3000/api/payments/mock-complete?payment_order_id=${payment_order_id}`;
  }

  return NextResponse.json({ payment_order_id, checkout_url });
}
