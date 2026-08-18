// ===========================================
// GET & PUT /api/users/[id]
// ===========================================
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getUserById,
  updateUser,
  checkEmailExists,
} from "@/services/user.service";
import { updateUserSchema, formatZodError } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin yang dapat melihat data ini" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json(
        { error: "Karyawan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("GET /api/users/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data karyawan" },
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
        { error: "Forbidden: Hanya Admin yang dapat mengubah data karyawan" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const existing = await getUserById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Karyawan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (parsed.data.email && parsed.data.email !== existing.email) {
      const emailExists = await checkEmailExists(parsed.data.email, id);
      if (emailExists) {
        return NextResponse.json(
          { error: "Email sudah digunakan oleh karyawan lain" },
          { status: 400 }
        );
      }
    }

    const updated = await updateUser(id, parsed.data);

    return NextResponse.json({
      success: true,
      message: "Data karyawan berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data karyawan" },
      { status: 500 }
    );
  }
}
