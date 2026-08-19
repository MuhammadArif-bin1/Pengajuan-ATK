// ===========================================
// GET & POST /api/requests
// ===========================================
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  createRequest,
  getRequestsByUser,
  getAllRequests,
} from "@/services/request.service";
import { createRequestSchema, formatZodError } from "@/lib/validation";
import type { RequestStatus } from "@/generated/prisma/enums";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") as RequestStatus) || undefined;
    const type = (searchParams.get("type") as "purchase" | "regular") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const department = searchParams.get("department") || undefined;
    const search = searchParams.get("search") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    // If logged in as regular user and requesting own data specifically
    if (session && session.role === "USER" && searchParams.get("myOnly") === "true") {
      const result = await getRequestsByUser(session.userId, {
        status,
        page,
        limit,
      });
      return NextResponse.json(result);
    }

    // Otherwise return filtered list (for Admin or public employee tracking)
    const result = await getAllRequests({
      status,
      department,
      search,
      startDate,
      endDate,
      type,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/requests error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar pengajuan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();

    // If user is logged in
    if (session) {
      const parsed = createRequestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: formatZodError(parsed.error) },
          { status: 400 }
        );
      }

      let atkItemId = parsed.data.atkItemId;
      if (!atkItemId && parsed.data.itemName) {
        let atkItem = await prisma.atkItem.findFirst({
          where: {
            name: {
              equals: parsed.data.itemName.trim(),
              mode: "insensitive",
            },
          },
        });
        if (!atkItem) {
          atkItem = await prisma.atkItem.create({
            data: {
              name: parsed.data.itemName.trim(),
              description: "Permintaan ATK Karyawan",
              unit: "pcs",
              stock: 0,
              isActive: true,
            },
          });
        }
        atkItemId = atkItem.id;
      }

      if (!atkItemId) {
        return NextResponse.json(
          { error: "Nama barang ATK wajib diisi" },
          { status: 400 }
        );
      }

      const newRequest = await createRequest({
        userId: session.userId,
        atkItemId,
        quantity: parsed.data.quantity,
        reason: parsed.data.reason,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Pengajuan ATK berhasil dibuat dan menunggu persetujuan",
          data: newRequest,
        },
        { status: 201 }
      );
    }

    // If public user (without login)
    const parsed = createRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    // Require name if not logged in
    if (!parsed.data.userName) {
      return NextResponse.json(
        { error: "Nama karyawan pemohon wajib diisi" },
        { status: 400 }
      );
    }

    let atkItemId = parsed.data.atkItemId;
    if (!atkItemId && parsed.data.itemName) {
      let atkItem = await prisma.atkItem.findFirst({
        where: {
          name: {
            equals: parsed.data.itemName.trim(),
            mode: "insensitive",
          },
        },
      });
      if (!atkItem) {
        atkItem = await prisma.atkItem.create({
          data: {
            name: parsed.data.itemName.trim(),
            description: "Permintaan ATK Karyawan",
            unit: "pcs",
            stock: 0,
            isActive: true,
          },
        });
      }
      atkItemId = atkItem.id;
    }

    if (!atkItemId) {
      return NextResponse.json(
        { error: "Nama barang ATK wajib diisi" },
        { status: 400 }
      );
    }

    const emailFallback =
      parsed.data.userEmail ||
      `${parsed.data.userName.toLowerCase().replace(/[^a-z0-9]/g, "") || "karyawan"}@hasamitra.internal`;

    const newRequest = await createRequest({
      userName: parsed.data.userName,
      userEmail: emailFallback,
      department: parsed.data.department || "Umum",
      position: parsed.data.position || "Staff",
      atkItemId,
      quantity: parsed.data.quantity,
      reason: parsed.data.reason?.trim() || "Kebutuhan operasional kantor",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pengajuan ATK berhasil dikirim dan berstatus MENUNGGU untuk ditinjau oleh Admin",
        data: newRequest,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/requests error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat pengajuan ATK" },
      { status: 400 }
    );
  }
}
