import { createClerkClient } from "@clerk/backend";
import { db } from "../app/lib/prisma";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function main() {
  let offset = 0;
  const limit = 100;
  let total = 0;
  let created = 0;
  let skipped = 0;

  while (true) {
    const { data: users, totalCount } = await clerk.users.getUserList({ limit, offset });
    if (total === 0) console.log(`Found ${totalCount} users in Clerk`);
    total = totalCount;

    for (const u of users) {
      const email = u.emailAddresses[0]?.emailAddress ?? `${u.id}@unknown`;
      const name = u.firstName ?? "—";
      const lastName = u.lastName ?? "—";

      const existing = await db.user.findUnique({ where: { id: u.id }, select: { id: true } });
      if (existing) {
        skipped++;
        continue;
      }

      await db.$transaction(async (tx) => {
        // Remove any stale row with the same email but a different ID (seed / old record)
        await tx.user.deleteMany({ where: { email, NOT: { id: u.id } } });
        await tx.user.upsert({
          where: { id: u.id },
          create: { id: u.id, name, lastName, email },
          update: {},
        });
      });

      console.log(`  created ${u.id} (${email})`);
      created++;
    }

    offset += users.length;
    if (offset >= total) break;
  }

  console.log(`\nDone — ${created} created, ${skipped} already existed`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
