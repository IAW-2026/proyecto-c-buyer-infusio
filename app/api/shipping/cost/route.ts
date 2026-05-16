import { NextRequest, NextResponse } from "next/server";

// Mock endpoint — mirrors POST /api/shipping/cost from the Shipping App contract.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { origin_postal_code, destination_postal_code } = body as {
    origin_postal_code: string;
    destination_postal_code: string;
  };

  // Simulate cost based on postal code distance (mock logic)
  const originNum = parseInt(origin_postal_code ?? "1000", 10);
  const destNum = parseInt(destination_postal_code ?? "1000", 10);
  const diff = Math.abs(originNum - destNum);

  let cost = 1500; // base cost in ARS
  if (diff > 3000) cost = 4200;
  else if (diff > 1000) cost = 2800;

  return NextResponse.json({ shipping_cost: cost, currency: "ARS" });
}
