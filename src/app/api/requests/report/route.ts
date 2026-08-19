// ===========================================
// GET /api/requests/report
// ===========================================
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getReportData } from "@/services/request.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin yang dapat melihat laporan" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const department = searchParams.get("department") || undefined;
    const type = (searchParams.get("type") as "purchase" | "regular") || undefined;

    const report = await getReportData({
      startDate,
      endDate,
      department,
      type,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("GET /api/requests/report error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data laporan" },
      { status: 500 }
    );
  }
}
