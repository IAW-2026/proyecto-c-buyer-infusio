import { NextResponse } from "next/server";

// Mock endpoint — mirrors GET /api/shipping/{shipping_id} from the Shipping App contract.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shipping_id: string }> }
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { shipping_id } = await params;

  return NextResponse.json({
    shipping_id,
    status: "in_transit",
    last_update: new Date().toISOString(),
    current_city: "Rosario",
  });
}
