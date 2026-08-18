// ===========================================
// POST /api/auth/logout
// ===========================================
import { NextResponse } from "next/server";
import { removeSessionCookie } from "@/lib/session";

export async function POST() {
  try {
    await removeSessionCookie();
    return NextResponse.json({
      success: true,
      message: "Logout berhasil",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Gagal melakukan logout" },
      { status: 500 }
    );
  }
}
