import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { accessCookieOptions, signAccessToken } from "@/lib/access";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "invoice.paid"
  ) {
    const res = NextResponse.json({ received: true });
    const opts = accessCookieOptions();
    res.cookies.set(opts.name, signAccessToken(), {
      httpOnly: opts.httpOnly,
      secure: opts.secure,
      sameSite: opts.sameSite,
      path: opts.path,
      maxAge: opts.maxAge,
    });
    return res;
  }

  return NextResponse.json({ received: true });
}
