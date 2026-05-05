import { NextResponse } from "next/server";

// Mock endpoint — mirrors GET /api/payments/status/{id} from the Payments App contract.
// Returns "accepted" for any ID that starts with "mock_pay_", "pending" otherwise.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { id } = await params;

  const status = id.startsWith("mock_pay_") ? "accepted" : "pending";

  return NextResponse.json({ status });
}
