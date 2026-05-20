import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { customerHasPaidAccess } from "@/lib/stripe-access";

const COOKIE_NAME = "calc_customer";

function secret(): string {
  return process.env.ACCESS_COOKIE_SECRET ?? "dev-secret-change-in-production";
}

function sign(customerId: string): string {
  const sig = createHmac("sha256", secret()).update(customerId).digest("hex");
  return `${customerId}.${sig}`;
}

export function parseCustomerCookie(token: string | undefined): string | null {
  if (!token) return null;
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  const customerId = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  if (!customerId.startsWith("cus_")) return null;

  const expected = createHmac("sha256", secret()).update(customerId).digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    return customerId;
  } catch {
    return null;
  }
}

export async function getCustomerId(): Promise<string | null> {
  const store = await cookies();
  return parseCustomerCookie(store.get(COOKIE_NAME)?.value);
}

/** Checks Stripe on every call — subscription cancel removes access; lifetime persists. */
export async function hasAccess(): Promise<boolean> {
  const customerId = await getCustomerId();
  if (!customerId) return false;

  try {
    return await customerHasPaidAccess(customerId);
  } catch {
    return false;
  }
}

export function customerCookieValue(customerId: string): string {
  return sign(customerId);
}

export function accessCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
