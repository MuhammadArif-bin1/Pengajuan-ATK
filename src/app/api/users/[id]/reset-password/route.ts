// ===========================================
// POST /api/users/[id]/reset-password
// ===========================================
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { resetUserPassword, getUserById } from "@/services/user.service";
import { resetPasswordSchema, formatZodError } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin yang dapat mereset password" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json(
        { error: "Karyawan tidak ditemukan" },
        { status: 404 }
      );
    }

    await resetUserPassword(id, parsed.data.password);

    return NextResponse.json({
      success: true,
      message: `Password untuk akun ${user.name} (${user.email}) berhasil direset`,
    });
  } catch (error) {
    console.error("POST /api/users/[id]/reset-password error:", error);
    return NextResponse.json(
      { error: "Gagal mereset password karyawan" },
      { status: 500 }
    );
  }
}
