import { NextResponse } from "next/server";
import { generateMathCaptcha } from "@/lib/captcha";

export async function GET() {
  try {
    const captcha = generateMathCaptcha();
    return NextResponse.json(captcha, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("GET /api/auth/captcha error:", error);
    return NextResponse.json(
      { error: "Gagal membuat captcha keamanan" },
      { status: 500 }
    );
  }
}
