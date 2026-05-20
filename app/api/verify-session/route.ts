import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import {
  accessCookieOptions,
  customerCookieValue,
} from "@/lib/access";
import { customerHasPaidAccess } from "@/lib/stripe-access";

export async function POST(req: NextRequest) {
  const { sessionId } = (await req.json()) as { sessionId?: string };
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;

    if (!customerId) {
      return NextResponse.json({ error: "No customer on session" }, { status: 400 });
    }

    if (session.mode === "payment") {
      await stripe.customers.update(customerId, {
        metadata: { lifetime_access: "true" },
      });
    }

    if (!(await customerHasPaidAccess(customerId))) {
      return NextResponse.json({ error: "Access not granted" }, { status: 402 });
    }

    const res = NextResponse.json({ ok: true });
    const opts = accessCookieOptions();
    res.cookies.set(opts.name, customerCookieValue(customerId), {
      httpOnly: opts.httpOnly,
      secure: opts.secure,
      sameSite: opts.sameSite,
      path: opts.path,
      maxAge: opts.maxAge,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Could not verify session" }, { status: 400 });
  }
}
