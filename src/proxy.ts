// ===========================================
// Proxy: Route Protection & Forwarding (Next.js 16+)
// ===========================================
// Public: / (Portal Pengajuan ATK Karyawan), /admin/login, public APIs
// Protected: /admin/* (Khusus ADMIN)

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

// ===========================================
// In-Memory Rate Limiter (Token / Sliding Window)
// ===========================================
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_CLEANUP_MS = 5 * 60 * 1000;
let lastRateLimitCleanup = Date.now();

function checkRateLimit(
  key: string,
  limit: number = 15,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();

  // Periodik membersihkan memori yang sudah kedaluwarsa
  if (now - lastRateLimitCleanup > RATE_LIMIT_CLEANUP_MS) {
    lastRateLimitCleanup = now;
    for (const [k, entry] of rateLimitMap.entries()) {
      if (entry.resetAt <= now) {
        rateLimitMap.delete(k);
      }
    }
  }

  const current = rateLimitMap.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfter };
  }

  current.count += 1;
  return { allowed: true, remaining: limit - current.count };
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // 1. Static and system assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check decoded pathname
  const decodedPath = decodeURIComponent(pathname);

  // Handle case-insensitive and space variations for Pengajuan Pembelian
  if (
    decodedPath === "/Pengajuan Pembelian" ||
    decodedPath.toLowerCase() === "/pengajuan pembelian" ||
    pathname === "/Pengajuan%20Pembelian" ||
    pathname === "/pengajuan-pembelian"
  ) {
    return NextResponse.redirect(new URL("/user/pengajuan-pembelian", request.url));
  }

  // 2. Public Frontend Pages (no auth needed)
  if (
    pathname === "/" ||
    pathname === "/user/pengajuan-pembelian" ||
    pathname === "/user/riwayat" ||
    pathname === "/admin" ||
    pathname === "/admin/login"
  ) {
    return NextResponse.next();
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2.5 Rate Limiter: Public Submission Endpoints (Maks. 15 per menit per IP)
  const isSubmissionApi =
    method === "POST" &&
    (pathname === "/api/requests" || pathname === "/api/requests/purchase");

  if (isSubmissionApi) {
    const clientIp = getClientIp(request);
    const { allowed, retryAfter } = checkRateLimit(
      `submit:${clientIp}`,
      15,
      60 * 1000
    );

    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "Terlalu banyak permintaan pengajuan ATK. Mohon tunggu beberapa saat sebelum mengirim kembali.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter || 60),
            "X-RateLimit-Limit": "15",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // 3. Public API Endpoints
  if (
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout" ||
    pathname === "/api/auth/captcha" ||
    pathname === "/api/users/departments" ||
    (pathname === "/api/atk" && method === "GET") ||
    (pathname === "/api/requests" && (method === "GET" || method === "POST")) ||
    (pathname === "/api/requests/portal-notifications" && method === "GET") ||
    (pathname === "/api/requests/purchase" && method === "POST")
  ) {
    return NextResponse.next();
  }

  // 4. Protected Admin Routes (/admin, /admin/*)
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("atk-session")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    try {
      const { payload } = await jwtVerify(token, getSecretKey());
      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL("/admin/login", request.url));
      res.cookies.delete("atk-session");
      return res;
    }
  }

  // 5. Protected Administrative APIs
  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get("atk-session")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }
    try {
      const { payload } = await jwtVerify(token, getSecretKey());
      if (payload.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Forbidden: Akses admin diperlukan" },
          { status: 403 }
        );
      }
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", payload.userId as string);
      requestHeaders.set("x-user-role", payload.role as string);
      requestHeaders.set("x-user-email", payload.email as string);
      requestHeaders.set("x-user-name", payload.name as string);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Unauthorized: Sesi tidak valid" },
        { status: 401 }
      );
    }
  }

  // 6. Any other route
  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
