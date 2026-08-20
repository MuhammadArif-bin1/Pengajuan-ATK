import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const requests = await prisma.atkRequest.findMany({
    take: 50,
    orderBy: { updatedAt: "desc" },
    include: {
      user: true,
      atkItem: true,
      processor: true,
    },
  });

  console.log("Returned requests count:", requests.length);
  console.log(JSON.stringify(requests, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
