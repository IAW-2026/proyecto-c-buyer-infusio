import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function withVerifyFullSsl(url: string) {
  // pg-connection-string warns when sslmode is 'prefer'/'require'/'verify-ca'.
  // Replacing with 'verify-full' silences the warning and matches current behaviour.
  const u = new URL(url);
  u.searchParams.set("sslmode", "verify-full");
  return u.toString();
}

function createClient() {
  const adapter = new PrismaPg({
    connectionString: withVerifyFullSsl(process.env.DATABASE_URL!),
    max: 5, // cap pool size so dev hot-reloads don't exhaust the DB connection limit
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

// Reuse the same instance across hot reloads in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const db = prisma;
