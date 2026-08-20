import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const reqs = await prisma.atkRequest.findMany({
    include: { user: true, atkItem: true, processor: true },
  });
  console.log("Found requests in DB:", reqs.length);
  reqs.forEach((r) => {
    console.log(`- Request ID: ${r.id}, User: ${r.user.name}, Item: ${r.atkItem.name}, Status: ${r.status}, UpdatedAt: ${r.updatedAt}`);
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
