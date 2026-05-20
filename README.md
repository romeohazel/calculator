# Calculator SaaS

A minimal calculator web app. You can use it normally — type `3×2` and press `=` — but the answer is gated behind payment.

## Plans

- **$299** one-time — lifetime access
- **$50/month** — subscription

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template and fill in Stripe keys (price IDs can wait until you have them):

```bash
cp .env.example .env.local
```

3. In [Stripe Dashboard](https://dashboard.stripe.com):

   - Create a **one-time** product/price for $299 → set `STRIPE_LIFETIME_PRICE_ID`
   - Create a **recurring** price at $50/month → set `STRIPE_MONTHLY_PRICE_ID`
   - Add your API keys

4. Run locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Webhooks (optional for local)

After payment, access is granted via `/success` verifying the Checkout session. For subscription renewals, configure a webhook:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Put the signing secret in `STRIPE_WEBHOOK_SECRET`.

## Flow

1. User enters an expression and presses `=`
2. Without access → pricing modal ($299 lifetime / $50 monthly)
3. Stripe Checkout → success page sets an access cookie
4. With access → answer is shown on `=`
# calculator
