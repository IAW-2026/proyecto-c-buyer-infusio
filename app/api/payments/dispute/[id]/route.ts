import { NextResponse } from "next/server";

// Mock endpoint — mirrors GET /api/payments/dispute/{id} from the Payments App contract.
// Returns "open" for any ID that starts with "mock_dispute_".
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id.startsWith("mock_dispute_")) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  return NextResponse.json({ status: "open" });
}
