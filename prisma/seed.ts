import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { UserRole } from "../generated/prisma/enums";
import { createClerkClient } from "@clerk/backend";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Test password for both seed users — change in Clerk dashboard after seeding
const TEST_PASSWORD = "Infusio2024!";

async function findOrCreateClerkUser(email: string, firstName: string, lastName: string, username: string) {
  const { data: existing } = await clerk.users.getUserList({ emailAddress: [email] });
  if (existing.length > 0) return existing[0];
  return clerk.users.createUser({
    emailAddress: [email],
    username,
    password: TEST_PASSWORD,
    firstName,
    lastName,
  });
}

async function main() {
  // Remove old placeholder records so real Clerk IDs can take over
  await prisma.user.deleteMany({
    where: { id: { in: ["user_seed_admin_001", "user_seed_client_001"] } },
  });

  const adminClerk = await findOrCreateClerkUser("admin@infusio.com", "Admin", "Infusio", "admin_infusio");
  await prisma.user.upsert({
    where: { id: adminClerk.id },
    update: {},
    create: {
      id: adminClerk.id,
      name: "Admin",
      lastName: "Infusio",
      email: "admin@infusio.com",
      role: UserRole.ADMIN,
    },
  });

  const clientClerk = await findOrCreateClerkUser("cliente@infusio.com", "Cliente", "Prueba", "cliente_prueba");
  await prisma.user.upsert({
    where: { id: clientClerk.id },
    update: {},
    create: {
      id: clientClerk.id,
      name: "Cliente",
      lastName: "Prueba",
      email: "cliente@infusio.com",
      role: UserRole.CLIENT,
    },
  });

  console.log(`\nSeed complete. Test password: ${TEST_PASSWORD}`);
  console.log(`  admin@infusio.com   → ${adminClerk.id}`);
  console.log(`  cliente@infusio.com → ${clientClerk.id}\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
