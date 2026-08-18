// ===========================================
// PATCH /api/atk/[id]/status
// ===========================================
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { toggleAtkItemStatus } from "@/services/atk.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin yang dapat mengubah status barang" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const updated = await toggleAtkItemStatus(id);

    if (!updated) {
      return NextResponse.json(
        { error: "Barang ATK tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Barang ATK berhasil ${updated.isActive ? "diaktifkan" : "dinonaktifkan"}`,
      data: updated,
    });
  } catch (error) {
    console.error("PATCH /api/atk/[id]/status error:", error);
    return NextResponse.json(
      { error: "Gagal mengubah status barang ATK" },
      { status: 500 }
    );
  }
}
