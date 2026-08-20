import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

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

    const cleanName = userName.trim();
    const cleanDept = department.trim();
    const cleanPos = position.trim();
    const emailFallback =
      userEmail?.trim() ||
      `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "")}.${cleanDept.toLowerCase().replace(/[^a-z0-9]/g, "")}@hasamitra.internal`;

    // 1. Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailFallback.toLowerCase() },
          { name: { equals: cleanName, mode: "insensitive" }, department: cleanDept },
        ],
      },
    });

    if (!user) {
      const defaultPassword = await hashPassword("User123!");
      user = await prisma.user.create({
        data: {
          name: cleanName,
          email: emailFallback.toLowerCase().trim(),
          password: defaultPassword,
          role: "USER",
          department: cleanDept,
          position: cleanPos,
          isActive: true,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: cleanName,
          department: cleanDept,
          position: cleanPos,
        },
      });
    }

    // 2. Construct Reason text
    const fullReason = [
      `[PENGAJUAN PEMBELIAN ATK BARU]`,
      reason?.trim() ? `Alasan: ${reason.trim()}` : `Alasan: Permohonan pengadaan barang baru untuk operasional kantor`,
    ].join("\n");

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
          status: "MENUNGGU",
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
        message: `Pengajuan pembelian ${createdRequests.length} barang ATK berhasil dikirim dan menunggu persetujuan Admin.`,
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
