// ===========================================
// GET & POST /api/atk
// ===========================================
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getAllAtkItems,
  getActiveAtkItems,
  createAtkItem,
  deleteAllAtkItems,
} from "@/services/atk.service";
import { createAtkItemSchema, formatZodError } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly");

    // For public portal / dropdown list
    if (activeOnly === "true") {
      const items = await getActiveAtkItems();
      return NextResponse.json({ data: items });
    }

    const session = await getSession();
    if (!session || session.role === "USER") {
      const items = await getActiveAtkItems();
      return NextResponse.json({ data: items });
    }

    // For admin table
    const search = searchParams.get("search") || undefined;
    const isActiveParam = searchParams.get("isActive");
    const isActive =
      isActiveParam !== null && isActiveParam !== ""
        ? isActiveParam === "true"
        : undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const result = await getAllAtkItems({
      search,
      isActive,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/atk error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data barang ATK" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin yang dapat menambah barang" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createAtkItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const item = await createAtkItem(parsed.data);

    return NextResponse.json(
      {
        success: true,
        message: "Barang ATK berhasil ditambahkan",
        data: item,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/atk error:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan barang ATK" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin yang dapat mengosongkan barang" },
        { status: 403 }
      );
    }

    const result = await deleteAllAtkItems();

    return NextResponse.json({
      success: true,
      message: `Semua data barang ATK (${result.count} item) berhasil dikosongkan`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("DELETE /api/atk error:", error);
    return NextResponse.json(
      { error: "Gagal mengosongkan data barang ATK" },
      { status: 500 }
    );
  }
}

