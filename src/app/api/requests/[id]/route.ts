import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getRequestById, deleteRequest } from "@/services/request.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const reqData = await getRequestById(id);

    if (!reqData) {
      return NextResponse.json(
        { error: "Pengajuan tidak ditemukan" },
        { status: 404 }
      );
    }

    // User can only view their own requests, admin can view any
    if (session.role === "USER" && reqData.userId !== session.userId) {
      return NextResponse.json(
        { error: "Forbidden: Anda tidak memiliki akses ke pengajuan ini" },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: reqData });
  } catch (error) {
    console.error("GET /api/requests/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengajuan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Akses Admin diperlukan untuk menghapus pengajuan" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await deleteRequest(id);

    return NextResponse.json({
      success: true,
      message: "Data pengajuan berhasil dihapus",
    });
  } catch (error: any) {
    console.error("DELETE /api/requests/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus data pengajuan" },
      { status: 500 }
    );
  }
}
