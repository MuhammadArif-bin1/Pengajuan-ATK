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

    const {
      userName,
      userEmail,
      department,
      position,
      reason,
      items,
      itemName,
      quantity,
      atkItemId,
    } = body;

    // Build list of items to process (supports multi-item list or single item fallback)
    interface ItemPayload {
      atkItemId?: string;
      itemName: string;
      quantity: number;
    }

    const itemsToProcess: ItemPayload[] = [];

    if (Array.isArray(items) && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const cleanName = String(item.itemName || "").trim();
        const qty = parseInt(String(item.quantity).replace(/\D/g, ""), 10) || 0;

        if (!cleanName && items.length === 1) {
          return NextResponse.json(
            { error: "Nama barang ATK wajib diisi" },
            { status: 400 }
          );
        }
        if (cleanName) {
          if (qty < 1) {
            return NextResponse.json(
              { error: `Jumlah barang "${cleanName}" minimal 1` },
              { status: 400 }
            );
          }
          itemsToProcess.push({
            atkItemId: item.atkItemId,
            itemName: cleanName,
            quantity: qty,
          });
        }
      }
    } else if (itemName || atkItemId) {
      const cleanName = String(itemName || "").trim();
      const qty = parseInt(String(quantity).replace(/\D/g, ""), 10) || 1;
      itemsToProcess.push({
        atkItemId,
        itemName: cleanName,
        quantity: qty,
      });
    }

    if (itemsToProcess.length === 0) {
      return NextResponse.json(
        { error: "Minimal masukkan 1 barang ATK yang diajukan" },
        { status: 400 }
      );
    }

    const cleanReason = String(reason || "").trim() || "Kebutuhan operasional kantor";

    // 1. Explicit employee information provided (e.g. from Portal Karyawan)
    if (userName && String(userName).trim()) {
      const cleanUserName = String(userName).trim();
      const cleanDept = String(department || "Umum").trim();
      const cleanPos = String(position || "Staff").trim();
      const emailFallback =
        userEmail?.trim() ||
        `${cleanUserName.toLowerCase().replace(/[^a-z0-9]/g, "")}@hasamitra.internal`;

      const createdRequests = [];

      for (const itm of itemsToProcess) {
        let finalItemId = itm.atkItemId;

        if (!finalItemId && itm.itemName) {
          let atkItem = await prisma.atkItem.findFirst({
            where: {
              name: {
                equals: itm.itemName,
                mode: "insensitive",
              },
            },
          });

          if (!atkItem) {
            atkItem = await prisma.atkItem.create({
              data: {
                name: itm.itemName,
                description: "Permintaan ATK Karyawan",
                unit: "pcs",
                stock: 0,
                isActive: true,
              },
            });
          }
          finalItemId = atkItem.id;
        }

        if (!finalItemId) continue;

        const newRequest = await createRequest({
          userName: cleanUserName,
          userEmail: emailFallback,
          department: cleanDept,
          position: cleanPos,
          atkItemId: finalItemId,
          quantity: itm.quantity,
          reason: cleanReason,
        });

        createdRequests.push(newRequest);
      }

      return NextResponse.json(
        {
          success: true,
          message: `Berhasil mengirim ${createdRequests.length} pengajuan ATK!`,
          data: createdRequests.length === 1 ? createdRequests[0] : createdRequests,
          items: createdRequests,
        },
        { status: 201 }
      );
    }

    // 2. Logged-in session without explicit userName
    if (session) {
      const createdRequests = [];

      for (const itm of itemsToProcess) {
        let finalItemId = itm.atkItemId;

        if (!finalItemId && itm.itemName) {
          let atkItem = await prisma.atkItem.findFirst({
            where: {
              name: {
                equals: itm.itemName,
                mode: "insensitive",
              },
            },
          });

          if (!atkItem) {
            atkItem = await prisma.atkItem.create({
              data: {
                name: itm.itemName,
                description: "Permintaan ATK Karyawan",
                unit: "pcs",
                stock: 0,
                isActive: true,
              },
            });
          }
          finalItemId = atkItem.id;
        }

        if (!finalItemId) continue;

        const newRequest = await createRequest({
          userId: session.userId,
          atkItemId: finalItemId,
          quantity: itm.quantity,
          reason: cleanReason,
        });

        createdRequests.push(newRequest);
      }

      return NextResponse.json(
        {
          success: true,
          message: `Berhasil membuat ${createdRequests.length} pengajuan ATK!`,
          data: createdRequests.length === 1 ? createdRequests[0] : createdRequests,
          items: createdRequests,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: "Nama karyawan pemohon wajib diisi" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("POST /api/requests error:", error);
    const message = error instanceof Error ? error.message : "Gagal membuat pengajuan ATK";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
