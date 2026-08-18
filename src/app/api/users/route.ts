// ===========================================
// GET & POST /api/users
// ===========================================
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getAllUsers,
  createUser,
  checkEmailExists,
} from "@/services/user.service";
import { createUserSchema, formatZodError } from "@/lib/validation";
import type { Role } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin yang dapat melihat data pengguna" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const role = (searchParams.get("role") as Role) || undefined;
    const isActiveParam = searchParams.get("isActive");
    const isActive =
      isActiveParam !== null && isActiveParam !== ""
        ? isActiveParam === "true"
        : undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const result = await getAllUsers({
      search,
      role,
      isActive,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data karyawan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin yang dapat menambah pengguna" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const emailExists = await checkEmailExists(parsed.data.email);
    if (emailExists) {
      return NextResponse.json(
        { error: "Email sudah digunakan oleh karyawan lain" },
        { status: 400 }
      );
    }

    const newUser = await createUser(parsed.data);

    return NextResponse.json(
      {
        success: true,
        message: "Data karyawan berhasil dibuat",
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { error: "Gagal membuat data karyawan" },
      { status: 500 }
    );
  }
}
