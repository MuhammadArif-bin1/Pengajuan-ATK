import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const approved = await prisma.atkRequest.findMany({
    where: { status: "DISETUJUI" },
    include: { atkItem: true },
  });

  for (const req of approved) {
    if (req.atkItem && req.atkItem.stock === 100 && req.quantity === 10) {
      await prisma.atkItem.update({
        where: { id: req.atkItemId },
        data: { stock: 90 },
      });
      console.log(`Deducted ${req.quantity} ${req.atkItem.unit} from ${req.atkItem.name}. New stock: 90`);
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
