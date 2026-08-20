import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Emptying ATK requests and items...");
  const delReq = await prisma.atkRequest.deleteMany({});
  console.log(`Deleted ${delReq.count} requests`);

  const delItems = await prisma.atkItem.deleteMany({});
  console.log(`Deleted ${delItems.count} ATK items`);

  await prisma.$disconnect();
  await pool.end();
  console.log("Done! ATK items are now clean and empty.");
}

main().catch(console.error);
