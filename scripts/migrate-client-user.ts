/**
 * One-off migration: transfer all DB data from cliente@infusio.com → buyer+clerktest@iaw.com
 * then delete the old Clerk user.
 *
 * Run once:
 *   npx tsx --tsconfig tsconfig.json scripts/migrate-client-user.ts
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { createClerkClient } from "@clerk/backend";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function main() {
  const OLD_EMAIL = "cliente@infusio.com";
  const NEW_EMAIL = "buyer+clerktest@iaw.com";
  const NEW_PASSWORD = "iawuser#";

  // ── 1. Resolve Clerk IDs ────────────────────────────────────────────────────
  const { data: oldUsers } = await clerk.users.getUserList({ emailAddress: [OLD_EMAIL] });
  const { data: newUsers } = await clerk.users.getUserList({ emailAddress: [NEW_EMAIL] });

  if (oldUsers.length === 0) {
    console.log("cliente@infusio.com not found in Clerk — nothing to migrate.");
    return;
  }
  if (newUsers.length === 0) {
    console.log("buyer+clerktest@iaw.com not found in Clerk — run seed first.");
    return;
  }

  const oldId = oldUsers[0].id;
  const newId = newUsers[0].id;
  console.log(`Old Clerk ID: ${oldId}`);
  console.log(`New Clerk ID: ${newId}`);

  // ── 2. Migrate DB records ───────────────────────────────────────────────────
  await prisma.$transaction(async (tx) => {
    // Ensure the new User row exists in the DB
    await tx.user.upsert({
      where: { id: newId },
      update: { email: NEW_EMAIL },
      create: { id: newId, name: "Cliente", lastName: "Prueba", email: NEW_EMAIL, roles: ["CLIENT"] },
    });

    // Tables with a proper FK → userId
    await tx.address.updateMany({ where: { userId: oldId }, data: { userId: newId } });
    await tx.cart.updateMany({ where: { userId: oldId }, data: { userId: newId } });
    await tx.purchaseOrder.updateMany({ where: { userId: oldId }, data: { userId: newId } });

    // FavouriteProduct has a composite PK [userId, productId] — must re-create rows
    const favs = await tx.favouriteProduct.findMany({ where: { userId: oldId } });
    if (favs.length > 0) {
      await tx.favouriteProduct.createMany({
        data: favs.map((f) => ({ ...f, userId: newId })),
        skipDuplicates: true,
      });
      await tx.favouriteProduct.deleteMany({ where: { userId: oldId } });
      console.log(`  Migrated ${favs.length} favourite products`);
    }

    // FavouriteShare and Package store userId/buyerId as plain strings (no FK)
    await tx.favouriteShare.updateMany({ where: { userId: oldId }, data: { userId: newId } });
    await tx.package.updateMany({ where: { buyerId: oldId }, data: { buyerId: newId } });

    // Now safe to delete the old User row
    await tx.user.deleteMany({ where: { id: oldId } });
    console.log("  DB records migrated and old User row deleted");
  });

  // ── 3. Update new Clerk user password ───────────────────────────────────────
  await clerk.users.updateUser(newId, { password: NEW_PASSWORD });
  console.log("  Password updated");

  // ── 4. Delete old Clerk user ────────────────────────────────────────────────
  await clerk.users.deleteUser(oldId);
  console.log(`  Clerk user ${OLD_EMAIL} deleted`);

  console.log("\nMigration complete. Log in with:");
  console.log(`  Email:    ${NEW_EMAIL}`);
  console.log(`  Password: ${NEW_PASSWORD}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
