// ===========================================
// ATK Request Service
// ===========================================

import { prisma } from "@/lib/prisma";
import type { RequestStatus } from "@/generated/prisma";

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
  if (!targetUserId && data.userEmail) {
    let existingUser = await prisma.user.findUnique({
      where: { email: data.userEmail.toLowerCase().trim() },
    });

    if (!existingUser) {
      // Create user automatically for employee
      const { hashPassword } = await import("@/lib/auth");
      const defaultPassword = await hashPassword("User123!");
      existingUser = await prisma.user.create({
        data: {
          name: data.userName || "Karyawan",
          email: data.userEmail.toLowerCase().trim(),
          password: defaultPassword,
          role: "USER",
          department: data.department || "Umum",
          position: data.position || "Staff",
          isActive: true,
        },
      });
    } else {
      // Update name/dept/position if provided
      if (data.userName || data.department || data.position) {
        existingUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: data.userName || existingUser.name,
            department: data.department || existingUser.department,
            position: data.position || existingUser.position,
          },
        });
      }
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

  if (item.stock < data.quantity) {
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

export async function getRequestStats(userId?: string) {
  const where = userId ? { userId } : {};

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
}) {
  const where: Record<string, unknown> = {};

  if (filters?.department) {
    where.user = { department: filters.department };
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
        select: { name: true, department: true },
      },
      atkItem: {
        select: { name: true, unit: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Aggregate by department
  const byDepartment: Record<
    string,
    { total: number; approved: number; rejected: number }
  > = {};
  // Aggregate by item
  const byItem: Record<string, { total: number; quantity: number }> = {};

  for (const req of requests) {
    const dept = req.user.department;
    if (!byDepartment[dept]) {
      byDepartment[dept] = { total: 0, approved: 0, rejected: 0 };
    }
    byDepartment[dept].total++;
    if (req.status === "DISETUJUI" || req.status === "DIPROSES" || req.status === "SELESAI") {
      byDepartment[dept].approved++;
    }
    if (req.status === "DITOLAK") {
      byDepartment[dept].rejected++;
    }

    const itemName = req.atkItem.name;
    if (!byItem[itemName]) {
      byItem[itemName] = { total: 0, quantity: 0 };
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

