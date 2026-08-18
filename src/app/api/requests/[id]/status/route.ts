// ===========================================
// PATCH /api/requests/[id]/status
// ===========================================
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { updateRequestStatus } from "@/services/request.service";
import { updateRequestStatusSchema, formatZodError } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin yang dapat memproses pengajuan" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateRequestStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const updated = await updateRequestStatus(
      id,
      session.userId,
      parsed.data.status,
      parsed.data.adminNote
    );

    return NextResponse.json({
      success: true,
      message: `Status pengajuan berhasil diubah menjadi ${parsed.data.status}`,
      data: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/requests/[id]/status error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengubah status pengajuan" },
      { status: 400 }
    );
  }
}
