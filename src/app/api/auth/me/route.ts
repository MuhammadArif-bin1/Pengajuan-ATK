// ===========================================
// GET /api/auth/me
// ===========================================
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserById } from "@/services/user.service";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: Tidak ada sesi aktif" },
        { status: 401 }
      );
    }

    const user = await getUserById(session.userId);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan atau tidak aktif" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data user" },
      { status: 500 }
    );
  }
}
