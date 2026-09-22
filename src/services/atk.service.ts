// ===========================================
// ATK Item Service
// ===========================================

import { prisma } from "@/lib/prisma";

// ===========================================
// CRUD Operations
// ===========================================

export async function getAllAtkItems(filters?: {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  const [items, total] = await Promise.all([
    prisma.atkItem.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.atkItem.count({ where }),
  ]);

  return {
    data: items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getActiveAtkItems() {
  return prisma.atkItem.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getAtkItemById(id: string) {
  return prisma.atkItem.findUnique({ where: { id } });
}

export async function createAtkItem(data: {
  name: string;
  description?: string | null;
  stock: number;
  unit: string;
}) {
  return prisma.atkItem.create({ data });
}

export async function updateAtkItem(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    stock?: number;
    unit?: string;
  }
) {
  return prisma.atkItem.update({
    where: { id },
    data,
  });
}

export async function toggleAtkItemStatus(id: string) {
  const item = await prisma.atkItem.findUnique({ where: { id } });
  if (!item) return null;

  return prisma.atkItem.update({
    where: { id },
    data: { isActive: !item.isActive },
  });
}

export async function deleteAtkItem(id: string) {
  return prisma.$transaction(async (tx) => {
    // Hapus terlebih dahulu pengajuan/riwayat yang terhubung dengan barang ini
    await tx.atkRequest.deleteMany({
      where: { atkItemId: id },
    });
    // Kemudian hapus barang dari katalog inventaris
    return tx.atkItem.delete({
      where: { id },
    });
  });
}

export async function deleteAllAtkItems() {
  return prisma.$transaction(async (tx) => {
    await tx.atkRequest.deleteMany({});
    return tx.atkItem.deleteMany({});
  });
}

// ===========================================
// Statistics
// ===========================================

export async function getAtkItemStats() {
  const [total, active, lowStock] = await Promise.all([
    prisma.atkItem.count(),
    prisma.atkItem.count({ where: { isActive: true } }),
    prisma.atkItem.count({ where: { isActive: true, stock: { lte: 5 } } }),
  ]);

  return { total, active, lowStock };
}
