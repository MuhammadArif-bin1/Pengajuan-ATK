// ===========================================
// POST /api/auth/login
// ===========================================
import { NextRequest, NextResponse } from "next/server";
import { loginSchema, formatZodError } from "@/lib/validation";
import { authenticateUser } from "@/services/user.service";
import { createToken } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { verifyMathCaptcha } from "@/lib/captcha";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    // Math Captcha Security Verification
    const { captchaToken, captchaAnswer } = body;
    if (!captchaToken || captchaAnswer === undefined || String(captchaAnswer).trim() === "") {
      return NextResponse.json(
        { error: "Verifikasi Captcha Matematika wajib diisi untuk keamanan audit." },
        { status: 400 }
      );
    }

    const captchaCheck = verifyMathCaptcha(captchaToken, captchaAnswer);
    if (!captchaCheck.valid) {
      return NextResponse.json(
        { error: captchaCheck.reason || "Jawaban captcha matematika salah. Silakan coba lagi." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: "Email atau password salah, atau akun dinonaktifkan" },
        { status: 401 }
      );
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
      },
      redirectTo: user.role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada server" },
      { status: 500 }
    );
  }
}
