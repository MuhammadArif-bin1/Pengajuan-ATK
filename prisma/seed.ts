// ===========================================
// Database Seed
// ===========================================
// Populates initial data: admin user, sample user, ATK items

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // =========================================
  // 1. Create Admin User
  // =========================================
  const adminEmail = process.env.ADMIN_EMAIL || "admin@company.com";
  const adminRawPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const adminPassword = await bcrypt.hash(adminRawPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: adminPassword,
    },
    create: {
      name: "Administrator",
      email: adminEmail,
      password: adminPassword,
      role: "ADMIN",
      department: "IT",
      position: "System Administrator",
      isActive: true,
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // =========================================
  // 2. Create Sample Users
  // =========================================
  const userPassword = await bcrypt.hash("User123!", 12);

  const users = [
    {
      name: "Budi Santoso",
      email: "user@company.com",
      department: "Keuangan",
      position: "Staff Keuangan",
    },
    {
      name: "Siti Rahayu",
      email: "siti@company.com",
      department: "HRD",
      position: "HR Officer",
    },
    {
      name: "Ahmad Fauzi",
      email: "ahmad@company.com",
      department: "Marketing",
      position: "Marketing Executive",
    },
    {
      name: "Dewi Lestari",
      email: "dewi@company.com",
      department: "Operasional",
      position: "Staff Operasional",
    },
    {
      name: "Rudi Hartono",
      email: "rudi@company.com",
      department: "IT",
      position: "IT Support",
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: userPassword,
        role: "USER",
        isActive: true,
      },
    });
    console.log(`✅ User created: ${user.email}`);
  }

  // =========================================
  // 3. Create ATK Items
  // =========================================
  const atkItems = [
    {
      name: "Pulpen",
      description: "Pulpen tinta hitam standar",
      stock: 100,
      unit: "pcs",
    },
    {
      name: "Pensil",
      description: "Pensil 2B standar",
      stock: 80,
      unit: "pcs",
    },
    {
      name: "Penghapus",
      description: "Penghapus pensil putih",
      stock: 50,
      unit: "pcs",
    },
    {
      name: "Buku Tulis",
      description: "Buku tulis A5 50 lembar",
      stock: 60,
      unit: "pcs",
    },
    {
      name: "Kertas A4",
      description: "Kertas HVS A4 70gsm",
      stock: 30,
      unit: "rim",
    },
    {
      name: "Kertas F4",
      description: "Kertas HVS F4 70gsm",
      stock: 20,
      unit: "rim",
    },
    {
      name: "Map",
      description: "Map plastik dokumen",
      stock: 40,
      unit: "pcs",
    },
    {
      name: "Stapler",
      description: "Stapler ukuran sedang",
      stock: 15,
      unit: "unit",
    },
    {
      name: "Isi Stapler",
      description: "Isi stapler No. 10",
      stock: 25,
      unit: "box",
    },
    {
      name: "Spidol",
      description: "Spidol whiteboard hitam",
      stock: 30,
      unit: "pcs",
    },
    {
      name: "Tinta Printer",
      description: "Tinta printer hitam universal",
      stock: 10,
      unit: "pcs",
    },
    {
      name: "Sticky Note",
      description: "Sticky note warna kuning 3x3",
      stock: 45,
      unit: "pack",
    },
    {
      name: "Amplop",
      description: "Amplop putih ukuran standar",
      stock: 35,
      unit: "pack",
    },
    {
      name: "Binder",
      description: "Binder clip ukuran sedang",
      stock: 20,
      unit: "box",
    },
  ];

  for (const item of atkItems) {
    const existing = await prisma.atkItem.findFirst({
      where: { name: item.name },
    });
    if (existing) {
      await prisma.atkItem.update({
        where: { id: existing.id },
        data: item,
      });
      console.log(`✅ ATK Item updated: ${item.name}`);
    } else {
      const created = await prisma.atkItem.create({
        data: item,
      });
      console.log(`✅ ATK Item created: ${created.name}`);
    }
  }

  // =========================================
  // 4. Create Sample Requests
  // =========================================
  const existingRequestsCount = await prisma.atkRequest.count();
  if (existingRequestsCount === 0) {
    const allUsers = await prisma.user.findMany({
      where: { role: "USER" },
    });
    const allItems = await prisma.atkItem.findMany();

    if (allUsers.length > 0 && allItems.length >= 12) {
      const sampleRequests = [
        {
          userId: allUsers[0].id,
          atkItemId: allItems[0].id,
          quantity: 5,
          reason: "Kebutuhan operasional harian departemen keuangan",
          status: "MENUNGGU" as const,
        },
        {
          userId: allUsers[0].id,
          atkItemId: allItems[4].id,
          quantity: 2,
          reason: "Stok kertas departemen habis untuk cetak laporan bulanan",
          status: "DISETUJUI" as const,
        },
        {
          userId: allUsers[1].id,
          atkItemId: allItems[11].id,
          quantity: 3,
          reason: "Untuk keperluan catatan rapat mingguan HRD",
          status: "SELESAI" as const,
        },
        {
          userId: allUsers[2].id,
          atkItemId: allItems[9].id,
          quantity: 4,
          reason: "Presentasi client untuk kebutuhan marketing",
          status: "MENUNGGU" as const,
        },
        {
          userId: allUsers[3].id,
          atkItemId: allItems[7].id,
          quantity: 1,
          reason: "Stapler lama rusak, perlu pengganti",
          status: "DITOLAK" as const,
          adminNote:
            "Silakan gunakan stapler departemen terlebih dahulu, stok masih cukup",
        },
      ];

      for (const req of sampleRequests) {
        await prisma.atkRequest.create({
          data: {
            userId: req.userId,
            atkItemId: req.atkItemId,
            quantity: req.quantity,
            reason: req.reason,
            status: req.status,
            adminNote: req.adminNote,
            processedBy:
              req.status !== "MENUNGGU" ? admin.id : undefined,
            processedAt:
              req.status !== "MENUNGGU" ? new Date() : undefined,
          },
        });
      }
      console.log(`✅ Sample requests created`);
    }
  }

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
