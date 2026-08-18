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

  // 2. Public Frontend Pages (no auth needed)
  if (
    pathname === "/" ||
    pathname === "/admin" ||
    pathname === "/admin/login"
  ) {
    return NextResponse.next();
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. Public API Endpoints
  if (
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout" ||
    pathname === "/api/users/departments" ||
    (pathname === "/api/atk" && method === "GET") ||
    (pathname === "/api/requests" && (method === "GET" || method === "POST"))
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
