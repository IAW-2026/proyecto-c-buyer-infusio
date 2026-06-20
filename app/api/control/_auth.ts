import { NextResponse } from "next/server";

export function validateControlKey(req: Request): NextResponse | null {
  const key = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!key || key !== process.env.CONTROL_PLANE_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
