// ===========================================
// PATCH /api/users/[id]/status
// ===========================================
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { toggleUserStatus } from "@/services/user.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin yang dapat mengubah status akun" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Prevent deactivating own account
    if (session.userId === id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menonaktifkan akun Anda sendiri" },
        { status: 400 }
      );
    }

    const updated = await toggleUserStatus(id);

    if (!updated) {
      return NextResponse.json(
        { error: "Karyawan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Akun karyawan berhasil ${updated.isActive ? "diaktifkan" : "dinonaktifkan"}`,
      data: updated,
    });
  } catch (error) {
    console.error("PATCH /api/users/[id]/status error:", error);
    return NextResponse.json(
      { error: "Gagal mengubah status akun karyawan" },
      { status: 500 }
    );
  }
}
