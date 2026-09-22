import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    const search = searchParams.get("search");
    const type = searchParams.get("type"); // "regular" | "purchase" | "all"
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: Record<string, unknown> = {};

    // Filter tipe pengajuan: jika bukan "purchase" atau "all", jangan tampilkan pengajuan pembelian di antrian
    if (type === "purchase") {
      where.reason = { contains: "[PENGAJUAN PEMBELIAN ATK BARU]" };
    } else if (type !== "all") {
      // Default / "regular": Hanya permohonan ATK reguler
      where.NOT = { reason: { contains: "[PENGAJUAN PEMBELIAN ATK BARU]" } };
    }

    let idList: string[] = [];
    if (idsParam) {
      idList = idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { department: { contains: q, mode: "insensitive" } } },
        { atkItem: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const requests = await prisma.atkRequest.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: "desc" },
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
        processor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const formatted = requests.map((req) => {
      const reasonText = req.reason || "";
      const isPurchase = reasonText.includes("[PENGAJUAN PEMBELIAN ATK BARU]");
      let cleanReason = reasonText.replace("[PENGAJUAN PEMBELIAN ATK BARU]", "").trim();
      if (cleanReason.startsWith("Alasan:")) {
        cleanReason = cleanReason.replace(/^Alasan:\s*/, "").trim();
      }

      return {
        id: req.id,
        userName: req.user?.name || "Karyawan",
        department: req.user?.department || "-",
        position: req.user?.position || "-",
        itemName: req.atkItem?.name || "Barang ATK",
        quantity: req.quantity,
        unit: req.atkItem?.unit || "pcs",
        reason: cleanReason,
        status: req.status,
        adminNote: req.adminNote || null,
        processedByName: req.processor?.name || null,
        processedAt: req.processedAt ? req.processedAt.toISOString() : null,
        createdAt: req.createdAt ? req.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: req.updatedAt ? req.updatedAt.toISOString() : new Date().toISOString(),
        isPurchase,
        isMyRequest: idList.length > 0 ? idList.includes(req.id) : true,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: formatted,
        total: formatted.length,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/requests/portal-notifications error:", error);
    return NextResponse.json(
      { error: "Gagal memuat status pengajuan" },
      { status: 500 }
    );
  }
}
