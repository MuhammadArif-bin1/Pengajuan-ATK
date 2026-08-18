// ===========================================
// GET /api/requests/stats
// ===========================================
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getRequestStats } from "@/services/request.service";
import { getUserStats } from "@/services/user.service";
import { getAtkItemStats } from "@/services/atk.service";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "USER") {
      const requestStats = await getRequestStats(session.userId);
      return NextResponse.json({
        requests: requestStats,
      });
    }

    // Role is ADMIN: return comprehensive stats
    const [requestStats, userStats, atkStats] = await Promise.all([
      getRequestStats(),
      getUserStats(),
      getAtkItemStats(),
    ]);

    return NextResponse.json({
      requests: requestStats,
      users: userStats,
      atk: atkStats,
    });
  } catch (error) {
    console.error("GET /api/requests/stats error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil statistik dashboard" },
      { status: 500 }
    );
  }
}
