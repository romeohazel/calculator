import { getStripe } from "@/lib/stripe";

/** True if customer has lifetime metadata or an active/trialing subscription. */
export async function customerHasPaidAccess(customerId: string): Promise<boolean> {
  const stripe = getStripe();

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return false;

  if (customer.metadata?.lifetime_access === "true") {
    return true;
  }

  const active = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });
  if (active.data.length > 0) return true;

  const trialing = await stripe.subscriptions.list({
    customer: customerId,
    status: "trialing",
    limit: 1,
  });
  return trialing.data.length > 0;
}
