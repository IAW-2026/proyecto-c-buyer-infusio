import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/prisma";
import { validateControlKey } from "../_auth";

export async function GET(req: NextRequest) {
  const authError = validateControlKey(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));

  const where = search
    ? {
        OR: [
          { name:     { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email:    { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, lastName: true, email: true, phoneNumber: true, roles: true, createdAt: true, updatedAt: true },
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const authError = validateControlKey(req);
  if (authError) return authError;

  const body = await req.json();
  const { id, name, lastName, email, phoneNumber, roles } = body as {
    id: string;
    name: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    roles?: string[];
  };

  if (!id || !name || !lastName || !email) {
    return NextResponse.json({ error: "id, name, lastName and email are required" }, { status: 400 });
  }

  const user = await db.user.create({
    data: { id, name, lastName, email, phoneNumber: phoneNumber ?? null, roles: (roles as never[]) ?? ["CLIENT"] },
  });

  return NextResponse.json({ user }, { status: 201 });
}
