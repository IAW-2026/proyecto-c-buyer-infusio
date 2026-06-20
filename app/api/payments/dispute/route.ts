import { NextRequest, NextResponse } from "next/server";

// Mock endpoint — mirrors POST /api/payments/dispute from the Payments App contract.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, payment_order_id } = body as {
    user_id: string;
    payment_order_id: string;
  };

  if (!user_id || !payment_order_id) {
    return NextResponse.json(
      { error: "user_id and payment_order_id are required" },
      { status: 400 }
    );
  }

  const dispute_id = `mock_dispute_${Date.now()}`;

  return NextResponse.json({ dispute_id }, { status: 201 });
}
