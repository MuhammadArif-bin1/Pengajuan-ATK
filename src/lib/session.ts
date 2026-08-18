// ===========================================
// Session Management
// ===========================================

import { cookies } from "next/headers";
import { verifyToken } from "./auth";
import type { JWTPayload } from "@/types/auth";

const COOKIE_NAME = "atk-session";

// ===========================================
// Cookie Operations
// ===========================================

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });
}

export async function removeSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

// ===========================================
// Session Verification
// ===========================================

export async function getSession(): Promise<JWTPayload | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const payload = await verifyToken(token);
  return payload;
}

export async function requireAuth(): Promise<JWTPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin(): Promise<JWTPayload> {
  const session = await requireAuth();
  if (session.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }
  return session;
}

export async function requireUser(): Promise<JWTPayload> {
  const session = await requireAuth();
  if (session.role !== "USER") {
    throw new Error("Forbidden: User access required");
  }
  return session;
}
