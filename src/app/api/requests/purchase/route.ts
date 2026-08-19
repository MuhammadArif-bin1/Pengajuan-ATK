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

    if (!itemName?.trim()) {
      return NextResponse.json(
        { error: "Nama barang ATK yang diajukan untuk dibeli wajib diisi." },
        { status: 400 }
      );
    }

    if (!quantity || Number(quantity) < 1) {
      return NextResponse.json(
        { error: "Jumlah barang yang diajukan minimal 1." },
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

    // 2. Find or create ATK Item
    let atkItem = await prisma.atkItem.findFirst({
      where: {
        name: {
          equals: itemName.trim(),
          mode: "insensitive",
        },
      },
    });

    if (!atkItem) {
      atkItem = await prisma.atkItem.create({
        data: {
          name: itemName.trim(),
          description: "Pengadaan ATK Baru",
          unit: "pcs",
          stock: 0,
          isActive: true,
        },
      });
    }

    // 3. Construct Reason text
    const fullReason = [
      `[PENGAJUAN PEMBELIAN ATK BARU]`,
      reason?.trim() ? `Alasan: ${reason.trim()}` : `Alasan: Permohonan pengadaan barang baru untuk operasional kantor`,
    ].join("\n");

    // 4. Create AtkRequest
    const newRequest = await prisma.atkRequest.create({
      data: {
        userId: user.id,
        atkItemId: atkItem.id,
        quantity: parseInt(quantity, 10) || 1,
        reason: fullReason,
        status: "MENUNGGU",
      },
      include: {
        user: true,
        atkItem: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pengajuan pembelian ATK berhasil dikirim dan menunggu persetujuan Admin.",
        data: newRequest,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/requests/purchase error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses pengajuan pembelian ATK" },
      { status: 500 }
    );
  }
}
