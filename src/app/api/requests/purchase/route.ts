import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateEmployeeUser } from "@/services/user.service";
import { buildPurchaseReason } from "@/lib/requestHelpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userName,
      userEmail,
      department,
      position,
      items,
      itemName,
      quantity,
      reason,
    } = body;

    if (!userName?.trim() || !department?.trim() || !position?.trim()) {
      return NextResponse.json(
        { error: "Data pemohon (Nama, Departemen, Jabatan) wajib diisi lengkap." },
        { status: 400 }
      );
    }

    // Build list of items to process
    interface PurchaseItemPayload {
      itemName: string;
      quantity: number;
    }

    const itemsToProcess: PurchaseItemPayload[] = [];

    if (Array.isArray(items) && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const itm = items[i];
        const cleanName = String(itm.itemName || "").trim();
        const qty = parseInt(String(itm.quantity).replace(/\D/g, ""), 10) || 0;

        if (!cleanName && items.length === 1) {
          return NextResponse.json(
            { error: "Nama barang ATK yang diajukan untuk dibeli wajib diisi." },
            { status: 400 }
          );
        }
        if (cleanName) {
          if (qty < 1) {
            return NextResponse.json(
              { error: `Jumlah pembelian barang "${cleanName}" minimal 1.` },
              { status: 400 }
            );
          }
          itemsToProcess.push({
            itemName: cleanName,
            quantity: qty,
          });
        }
      }
    } else if (itemName) {
      const cleanName = String(itemName).trim();
      const qty = parseInt(String(quantity).replace(/\D/g, ""), 10) || 1;
      itemsToProcess.push({
        itemName: cleanName,
        quantity: qty,
      });
    }

    if (itemsToProcess.length === 0) {
      return NextResponse.json(
        { error: "Nama barang ATK yang diajukan untuk dibeli wajib diisi." },
        { status: 400 }
      );
    }

    // 1. Find or create user via centralized employee helper
    const user = await getOrCreateEmployeeUser({
      name: userName,
      department,
      position,
      email: userEmail,
    });

    // 2. Construct Reason text
    const fullReason = buildPurchaseReason(reason);

    const createdRequests = [];

    // 3. Process each purchase item
    for (const itm of itemsToProcess) {
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
            description: "Pengadaan ATK Baru",
            unit: "pcs",
            stock: 0,
            isActive: true,
          },
        });
      }

      const newRequest = await prisma.atkRequest.create({
        data: {
          userId: user.id,
          atkItemId: atkItem.id,
          quantity: itm.quantity,
          reason: fullReason,
          status: "DIPROSES",
        },
        include: {
          user: true,
          atkItem: true,
        },
      });

      createdRequests.push(newRequest);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Pengajuan pembelian ${createdRequests.length} barang ATK berhasil dikirim dan sedang diproses Admin.`,
        data: createdRequests.length === 1 ? createdRequests[0] : createdRequests,
        items: createdRequests,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/requests/purchase error:", error);
    const message = error instanceof Error ? error.message : "Gagal memproses pengajuan pembelian ATK";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
