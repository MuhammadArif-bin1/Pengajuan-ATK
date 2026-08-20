import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: Record<string, unknown> = {};

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
      const isPurchase = req.reason.includes("[PENGAJUAN PEMBELIAN ATK BARU]");
      let cleanReason = req.reason.replace("[PENGAJUAN PEMBELIAN ATK BARU]", "").trim();
      if (cleanReason.startsWith("Alasan:")) {
        cleanReason = cleanReason.replace(/^Alasan:\s*/, "").trim();
      }

      return {
        id: req.id,
        userName: req.user.name,
        department: req.user.department,
        position: req.user.position,
        itemName: req.atkItem.name,
        quantity: req.quantity,
        unit: req.atkItem.unit || "pcs",
        reason: cleanReason,
        status: req.status,
        adminNote: req.adminNote || null,
        processedByName: req.processor?.name || null,
        processedAt: req.processedAt ? req.processedAt.toISOString() : null,
        createdAt: req.createdAt.toISOString(),
        updatedAt: req.updatedAt.toISOString(),
        isPurchase,
        isMyRequest: idList.length > 0 ? idList.includes(req.id) : true,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
      total: formatted.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET /api/requests/portal-notifications error:", error);
    return NextResponse.json(
      { error: "Gagal memuat status pengajuan" },
      { status: 500 }
    );
  }
}
