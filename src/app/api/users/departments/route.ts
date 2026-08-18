// ===========================================
// GET /api/users/departments
// ===========================================
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDepartments } from "@/services/request.service";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const departments = await getDepartments();

    return NextResponse.json({ data: departments });
  } catch (error) {
    console.error("GET /api/users/departments error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar departemen" },
      { status: 500 }
    );
  }
}
