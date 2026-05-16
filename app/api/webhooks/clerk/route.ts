import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/app/lib/prisma";

interface ClerkUserData {
  id: string;
  email_addresses: { email_address: string }[];
  first_name: string | null;
  last_name: string | null;
  phone_numbers: { phone_number: string }[];
}

export async function POST(request: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const payload = await request.text();
  const svixHeaders = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let evt: { type: string; data: ClerkUserData };
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(payload, svixHeaders) as typeof evt;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = evt;
  const userId = data.id;
  const email = data.email_addresses[0]?.email_address ?? "";
  const firstName = data.first_name ?? "";
  const lastName = data.last_name ?? "";
  const phone = data.phone_numbers[0]?.phone_number ?? null;

  if (type === "user.created") {
    // Guard: if email already exists under a different Clerk ID, skip creation
    const existingByEmail = await db.user.findUnique({ where: { email } });
    if (existingByEmail && existingByEmail.id !== userId) {
      return NextResponse.json({ ok: true, skipped: "email_conflict" });
    }

    await db.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email,
        name: firstName,
        lastName,
        phoneNumber: phone,
        roles: ["CLIENT"],
      },
    });
  } else if (type === "user.updated") {
    await db.user
      .update({ where: { id: userId }, data: { email, name: firstName, lastName, phoneNumber: phone } })
      .catch(() => null); // user may not exist in DB yet (e.g. updated before webhook was set up)
  }

  return NextResponse.json({ ok: true });
}
