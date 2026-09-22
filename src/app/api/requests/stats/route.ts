// ===========================================
// GET /api/requests/stats
// ===========================================
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getRequestStats } from "@/services/request.service";
import { getUserStats } from "@/services/user.service";
import { getAtkItemStats } from "@/services/atk.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") as "purchase" | "regular") || undefined;

    if (!type) {
      const [regularStats, purchaseStats, userStats, atkStats] = await Promise.all([
        getRequestStats(session.role === "USER" ? session.userId : undefined, "regular"),
        getRequestStats(session.role === "USER" ? session.userId : undefined, "purchase"),
        session.role === "ADMIN" ? getUserStats() : Promise.resolve(null),
        session.role === "ADMIN" ? getAtkItemStats() : Promise.resolve(null),
      ]);

      return NextResponse.json({
        regular: regularStats,
        purchase: purchaseStats,
        requests: regularStats,
        users: userStats,
        atk: atkStats,
      });
    }

    if (session.role === "USER") {
      const requestStats = await getRequestStats(session.userId, type);
      return NextResponse.json({
        requests: requestStats,
      });
    }

    // Role is ADMIN: return comprehensive stats for specific type
    const [requestStats, userStats, atkStats] = await Promise.all([
      getRequestStats(undefined, type),
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
