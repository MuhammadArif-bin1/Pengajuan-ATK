// ===========================================
// GET & PUT /api/atk/[id]
// ===========================================
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAtkItemById, updateAtkItem } from "@/services/atk.service";
import { updateAtkItemSchema, formatZodError } from "@/lib/validation";

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
    const item = await getAtkItemById(id);

    if (!item) {
      return NextResponse.json(
        { error: "Barang ATK tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: item });
  } catch (error) {
    console.error("GET /api/atk/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data barang ATK" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin yang dapat mengubah barang" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateAtkItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const existing = await getAtkItemById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Barang ATK tidak ditemukan" },
        { status: 404 }
      );
    }

    const updated = await updateAtkItem(id, parsed.data);

    return NextResponse.json({
      success: true,
      message: "Data barang berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error("PUT /api/atk/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui barang ATK" },
      { status: 500 }
    );
  }
}
