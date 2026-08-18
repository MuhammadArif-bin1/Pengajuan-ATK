import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { deleteMultipleRequests, deleteAllRequests } from "@/services/request.service";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Akses Admin diperlukan untuk menghapus pengajuan" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ids, all } = body;

    if (all === true) {
      const result = await deleteAllRequests();
      return NextResponse.json({
        success: true,
        message: `Seluruh data pengajuan (${result.count} data) berhasil dihapus`,
        count: result.count,
      });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Pilih setidaknya satu pengajuan untuk dihapus" },
        { status: 400 }
      );
    }

    const result = await deleteMultipleRequests(ids);
    return NextResponse.json({
      success: true,
      message: `${result.count} data pengajuan berhasil dihapus`,
      count: result.count,
    });
  } catch (error: any) {
    console.error("POST /api/requests/bulk-delete error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus data pengajuan" },
      { status: 500 }
    );
  }
}
