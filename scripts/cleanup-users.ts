import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Cleaning up orphaned non-admin users from Neon database...");

  // Delete all users who are not ADMIN and have no atkRequests
  const result = await prisma.user.deleteMany({
    where: {
      role: { not: "ADMIN" },
    },
  });

  console.log(`Successfully deleted ${result.count} non-admin user records from Neon DB.`);

  const remainingUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
  });

  console.log("Remaining users in Neon DB:", remainingUsers);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
