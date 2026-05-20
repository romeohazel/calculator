import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "calc_access";

function secret(): string {
  return process.env.ACCESS_COOKIE_SECRET ?? "dev-secret-change-in-production";
}

export function signAccessToken(): string {
  const payload = `granted:${Date.now()}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyAccessToken(token: string | undefined): boolean {
  if (!token) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b) && payload.startsWith("granted:");
  } catch {
    return false;
  }
}

export async function hasAccess(): Promise<boolean> {
  const store = await cookies();
  return verifyAccessToken(store.get(COOKIE_NAME)?.value);
}

export function accessCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 10,
  };
}
