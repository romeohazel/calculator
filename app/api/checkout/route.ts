import { NextRequest, NextResponse } from "next/server";
import { getStripe, appUrl } from "@/lib/stripe";

type Plan = "lifetime" | "monthly";

export async function POST(req: NextRequest) {
  const { plan } = (await req.json()) as { plan?: Plan };

  if (plan !== "lifetime" && plan !== "monthly") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const lifetimePriceId = process.env.STRIPE_LIFETIME_PRICE_ID;
  const monthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID;

  if (!lifetimePriceId || !monthlyPriceId) {
    return NextResponse.json(
      { error: "Stripe price IDs are not configured. Add them to .env.local" },
      { status: 500 },
    );
  }

  const priceId = plan === "lifetime" ? lifetimePriceId : monthlyPriceId;
  const base = appUrl();

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: plan === "lifetime" ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: base,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
