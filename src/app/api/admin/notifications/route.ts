import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch latest 20 requests with user and atkItem details
    const requests = await prisma.atkRequest.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
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
            stock: true,
          },
        },
      },
    });

    const notifications = requests.map((req) => {
      const isPurchase = req.reason.includes("[PENGAJUAN PEMBELIAN ATK BARU]");
      let cleanReason = req.reason.replace("[PENGAJUAN PEMBELIAN ATK BARU]", "").trim();
      if (cleanReason.startsWith("Alasan:")) {
        cleanReason = cleanReason.replace(/^Alasan:\s*/, "").trim();
      }

      return {
        id: req.id,
        type: isPurchase ? ("purchase" as const) : ("regular" as const),
        typeLabel: isPurchase ? "Pengajuan Pembelian ATK" : "Permintaan ATK Gudang",
        userName: req.user.name,
        department: req.user.department,
        position: req.user.position,
        itemName: req.atkItem.name,
        quantity: req.quantity,
        unit: req.atkItem.unit || "pcs",
        reason: cleanReason,
        status: req.status,
        createdAt: req.createdAt.toISOString(),
        targetUrl: isPurchase ? "/admin/barang" : "/admin/pengajuan",
      };
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      total: notifications.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET /api/admin/notifications error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data notifikasi" },
      { status: 500 }
    );
  }
}
