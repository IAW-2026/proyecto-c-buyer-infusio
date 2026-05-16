import { NextResponse } from "next/server";

const MOCK_STATUSES: Record<string, { status: string; city: string }> = {
  ship_delivered_001: { status: "delivered",  city: "Buenos Aires" },
  ship_delivered_002: { status: "delivered",  city: "Córdoba" },
  ship_pending_001:   { status: "pending",    city: "Mendoza" },
  ship_transit_001:   { status: "in_transit", city: "Rosario" },
  ship_transit_002:   { status: "in_transit", city: "Tucumán" },
  ship_incident_001:  { status: "incident",   city: "La Plata" },
};

// Mock endpoint — mirrors GET /api/shipping/{shipping_id} from the Shipping App contract.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shipping_id: string }> }
) {
  const { shipping_id } = await params;
  const mock = MOCK_STATUSES[shipping_id] ?? { status: "in_transit", city: "Rosario" };

  return NextResponse.json({
    shipping_id,
    status: mock.status,
    last_update: new Date().toISOString(),
    current_city: mock.city,
  });
}
