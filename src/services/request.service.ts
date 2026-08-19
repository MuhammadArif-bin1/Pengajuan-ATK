// ===========================================
// ATK Request Service
// ===========================================

import { prisma } from "@/lib/prisma";
import type { RequestStatus } from "@/generated/prisma/enums";

// ===========================================
// CRUD Operations
// ===========================================

export async function createRequest(data: {
  userId?: string;
  userName?: string;
  userEmail?: string;
  department?: string;
  position?: string;
  atkItemId: string;
  quantity: number;
  reason: string;
}) {
  let targetUserId = data.userId;

  // If public employee info is provided, find or create user
  if (!targetUserId && (data.userName || data.userEmail)) {
    const cleanName = (data.userName || "Karyawan").trim();
    const cleanDept = (data.department || "Umum").trim();
    const cleanPos = (data.position || "Staff").trim();
    const emailKey =
      data.userEmail?.toLowerCase().trim() ||
      `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "")}.${cleanDept.toLowerCase().replace(/[^a-z0-9]/g, "")}@hasamitra.internal`;

    let existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailKey },
          { name: { equals: cleanName, mode: "insensitive" }, department: cleanDept },
        ],
      },
    });

    if (!existingUser) {
      // Create user automatically for employee
      const { hashPassword } = await import("@/lib/auth");
      const defaultPassword = await hashPassword("User123!");
      existingUser = await prisma.user.create({
        data: {
          name: cleanName,
          email: emailKey,
          password: defaultPassword,
          role: "USER",
          department: cleanDept,
          position: cleanPos,
          isActive: true,
        },
      });
    } else {
      // Update name/dept/position to ensure 100% exact match with submitted form
      existingUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: cleanName,
          department: cleanDept,
          position: cleanPos,
        },
      });
    }
    targetUserId = existingUser.id;
  }

  if (!targetUserId) {
    throw new Error("Informasi karyawan pemohon wajib disertakan");
  }

  // Validate user is active
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });
  if (!user || !user.isActive) {
    throw new Error("Karyawan tidak aktif atau tidak ditemukan");
  }

  // Validate ATK item is active and has stock
  const item = await prisma.atkItem.findUnique({
    where: { id: data.atkItemId },
  });
  if (!item || !item.isActive) {
    throw new Error("Barang ATK tidak aktif atau tidak ditemukan");
  }

  if (data.userId && item.stock < data.quantity) {
    throw new Error(
      `Stok tidak mencukupi. Stok tersedia: ${item.stock} ${item.unit}`
    );
  }

  return prisma.atkRequest.create({
    data: {
      userId: targetUserId,
      atkItemId: data.atkItemId,
      quantity: data.quantity,
      reason: data.reason,
      status: "MENUNGGU",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          position: true,
        },
      },
      atkItem: {
        select: {
          id: true,
          name: true,
          unit: true,
        },
      },
    },
  });
}

export async function getRequestsByUser(
  userId: string,
  filters?: {
    status?: RequestStatus;
    page?: number;
    limit?: number;
  }
) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId };

  if (filters?.status) {
    where.status = filters.status;
  }

  const [requests, total] = await Promise.all([
    prisma.atkRequest.findMany({
      where,
      include: {
        atkItem: {
          select: { id: true, name: true, unit: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.atkRequest.count({ where }),
  ]);

  return {
    data: requests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAllRequests(filters?: {
  status?: RequestStatus;
  department?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  type?: "purchase" | "regular";
  page?: number;
  limit?: number;
}) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.department) {
    where.user = { department: filters.department };
  }

  if (filters?.type === "purchase") {
    where.reason = { contains: "[PENGAJUAN PEMBELIAN ATK BARU]" };
  } else if (filters?.type === "regular") {
    where.NOT = { reason: { contains: "[PENGAJUAN PEMBELIAN ATK BARU]" } };
  }

  if (filters?.search) {
    where.OR = [
      { user: { name: { contains: filters.search, mode: "insensitive" } } },
      {
        atkItem: { name: { contains: filters.search, mode: "insensitive" } },
      },
      { reason: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      (where.createdAt as Record<string, unknown>).gte = new Date(
        filters.startDate
      );
    }
    if (filters?.endDate) {
      (where.createdAt as Record<string, unknown>).lte = new Date(
        filters.endDate + "T23:59:59.999Z"
      );
    }
  }

  const [requests, total] = await Promise.all([
    prisma.atkRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            department: true,
            position: true,
          },
        },
        atkItem: {
          select: { id: true, name: true, unit: true },
        },
        processor: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.atkRequest.count({ where }),
  ]);

  return {
    data: requests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getRequestById(id: string) {
  return prisma.atkRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          position: true,
        },
      },
      atkItem: {
        select: { id: true, name: true, unit: true, stock: true },
      },
      processor: {
        select: { id: true, name: true },
      },
    },
  });
}

// ===========================================
// Status Management with Stock Transaction
// ===========================================

export async function updateRequestStatus(
  id: string,
  adminId: string,
  status: RequestStatus,
  adminNote?: string | null
) {
  const request = await prisma.atkRequest.findUnique({
    where: { id },
    include: { atkItem: true },
  });

  if (!request) {
    throw new Error("Pengajuan tidak ditemukan");
  }

  const prevStatus = request.status;

  // Require admin note for rejection if provided or fallback
  const finalNote = status === "DITOLAK"
    ? (adminNote || "Pengajuan ditolak oleh Administrator.")
    : (adminNote !== undefined ? adminNote : request.adminNote);

  // Case 1: Moving to DISETUJUI from status where stock was not yet deducted
  if (status === "DISETUJUI" && prevStatus !== "DISETUJUI" && prevStatus !== "DIPROSES" && prevStatus !== "SELESAI") {
    return prisma.$transaction(async (tx: any) => {
      const item = await tx.atkItem.findUnique({
        where: { id: request.atkItemId },
      });

      if (!item) {
        throw new Error("Barang ATK tidak ditemukan");
      }

      if (item.stock < request.quantity) {
        throw new Error(
          `Stok tidak mencukupi. Stok tersedia: ${item.stock} ${item.unit}, diminta: ${request.quantity} ${item.unit}`
        );
      }

      // Reduce stock
      await tx.atkItem.update({
        where: { id: request.atkItemId },
        data: { stock: { decrement: request.quantity } },
      });

      return tx.atkRequest.update({
        where: { id },
        data: {
          status,
          adminNote: finalNote,
          processedBy: adminId,
          processedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              position: true,
            },
          },
          atkItem: {
            select: { id: true, name: true, unit: true },
          },
          processor: {
            select: { id: true, name: true },
          },
        },
      });
    });
  }

  // Case 2: Moving from an approved/in-progress status to DITOLAK or MENUNGGU -> restore stock
  if ((status === "DITOLAK" || status === "MENUNGGU") && (prevStatus === "DISETUJUI" || prevStatus === "DIPROSES" || prevStatus === "SELESAI")) {
    return prisma.$transaction(async (tx: any) => {
      // Restore stock
      await tx.atkItem.update({
        where: { id: request.atkItemId },
        data: { stock: { increment: request.quantity } },
      });

      return tx.atkRequest.update({
        where: { id },
        data: {
          status,
          adminNote: finalNote,
          processedBy: adminId,
          processedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              position: true,
            },
          },
          atkItem: {
            select: { id: true, name: true, unit: true },
          },
          processor: {
            select: { id: true, name: true },
          },
        },
      });
    });
  }

  // Case 3: Other status transitions (e.g. DISETUJUI -> DIPROSES -> SELESAI, or MENUNGGU -> MENUNGGU)
  return prisma.atkRequest.update({
    where: { id },
    data: {
      status,
      adminNote: finalNote,
      processedBy: adminId,
      processedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          position: true,
        },
      },
      atkItem: {
        select: { id: true, name: true, unit: true },
      },
      processor: {
        select: { id: true, name: true },
      },
    },
  });
}

// ===========================================
// Statistics
// ===========================================

export async function getRequestStats(userId?: string, type?: "purchase" | "regular") {
  const where: Record<string, unknown> = userId ? { userId } : {};

  if (type === "purchase") {
    where.reason = { contains: "[PENGAJUAN PEMBELIAN ATK BARU]" };
  } else if (type === "regular") {
    where.NOT = { reason: { contains: "[PENGAJUAN PEMBELIAN ATK BARU]" } };
  }

  const [total, menunggu, disetujui, ditolak, diproses, selesai] =
    await Promise.all([
      prisma.atkRequest.count({ where }),
      prisma.atkRequest.count({
        where: { ...where, status: "MENUNGGU" },
      }),
      prisma.atkRequest.count({
        where: { ...where, status: "DISETUJUI" },
      }),
      prisma.atkRequest.count({
        where: { ...where, status: "DITOLAK" },
      }),
      prisma.atkRequest.count({
        where: { ...where, status: "DIPROSES" },
      }),
      prisma.atkRequest.count({
        where: { ...where, status: "SELESAI" },
      }),
    ]);

  return { total, menunggu, disetujui, ditolak, diproses, selesai };
}

export async function getReportData(filters?: {
  startDate?: string;
  endDate?: string;
  department?: string;
  type?: "purchase" | "regular";
}) {
  const where: Record<string, unknown> = {};

  if (filters?.department) {
    where.user = { department: filters.department };
  }

  if (filters?.type === "purchase") {
    where.reason = { contains: "[PENGAJUAN PEMBELIAN ATK BARU]" };
  } else if (filters?.type === "regular") {
    where.NOT = { reason: { contains: "[PENGAJUAN PEMBELIAN ATK BARU]" } };
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      (where.createdAt as Record<string, unknown>).gte = new Date(
        filters.startDate
      );
    }
    if (filters?.endDate) {
      (where.createdAt as Record<string, unknown>).lte = new Date(
        filters.endDate + "T23:59:59.999Z"
      );
    }
  }

  const requests = await prisma.atkRequest.findMany({
    where,
    include: {
      user: {
        select: { name: true, department: true, position: true, email: true },
      },
      atkItem: {
        select: { name: true, unit: true, stock: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Aggregate by department
  const byDepartment: Record<
    string,
    { total: number; approved: number; rejected: number; inProgress: number }
  > = {};
  // Aggregate by item
  const byItem: Record<string, { total: number; quantity: number; unit: string }> = {};

  for (const req of requests) {
    const dept = req.user.department || "Umum";
    if (!byDepartment[dept]) {
      byDepartment[dept] = { total: 0, approved: 0, rejected: 0, inProgress: 0 };
    }
    byDepartment[dept].total++;
    if (req.status === "DISETUJUI" || req.status === "SELESAI") {
      byDepartment[dept].approved++;
    } else if (req.status === "DIPROSES" || req.status === "MENUNGGU") {
      byDepartment[dept].inProgress++;
    } else if (req.status === "DITOLAK") {
      byDepartment[dept].rejected++;
    }

    const itemName = req.atkItem.name;
    const unit = req.atkItem.unit || "pcs";
    if (!byItem[itemName]) {
      byItem[itemName] = { total: 0, quantity: 0, unit };
    }
    byItem[itemName].total++;
    byItem[itemName].quantity += req.quantity;
  }

  return {
    requests,
    summary: {
      total: requests.length,
      byDepartment,
      byItem,
    },
  };
}

export async function getDepartments() {
  const departments = await prisma.user.findMany({
    select: { department: true },
    distinct: ["department"],
    orderBy: { department: "asc" },
  });
  return departments.map((d: { department: string }) => d.department);
}

export async function deleteRequest(id: string) {
  const existing = await prisma.atkRequest.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!existing) {
    throw new Error("Data pengajuan tidak ditemukan");
  }

  const deleted = await prisma.atkRequest.delete({
    where: { id },
  });

  // Check if the user has any remaining requests
  if (existing.userId) {
    const remainingRequests = await prisma.atkRequest.count({
      where: { userId: existing.userId },
    });

    if (remainingRequests === 0) {
      // Delete user from users table if not ADMIN
      await prisma.user.deleteMany({
        where: {
          id: existing.userId,
          role: { not: "ADMIN" },
        },
      });
    }
  }

  return deleted;
}

export async function deleteMultipleRequests(ids: string[]) {
  if (!ids || ids.length === 0) {
    throw new Error("Tidak ada data pengajuan yang dipilih");
  }

  // Get userIds of requests being deleted
  const requests = await prisma.atkRequest.findMany({
    where: { id: { in: ids } },
    select: { userId: true },
  });

  const userIds = Array.from(new Set(requests.map((r) => r.userId).filter(Boolean)));

  const deleted = await prisma.atkRequest.deleteMany({
    where: {
      id: { in: ids },
    },
  });

  // Clean up users who no longer have any requests (except ADMIN)
  for (const uId of userIds) {
    const remaining = await prisma.atkRequest.count({
      where: { userId: uId },
    });

    if (remaining === 0) {
      await prisma.user.deleteMany({
        where: {
          id: uId,
          role: { not: "ADMIN" },
        },
      });
    }
  }

  return deleted;
}

export async function deleteAllRequests() {
  const deletedRequests = await prisma.atkRequest.deleteMany({});

  // Sync: Delete all non-admin users from users table
  await prisma.user.deleteMany({
    where: {
      role: { not: "ADMIN" },
    },
  });

  return deletedRequests;
}


