# Stripe webhooks for VitalPlan

## Endpoint

`POST /api/webhooks/stripe`

No JWT auth. Stripe signs the request; the API verifies `Stripe-Signature` using `STRIPE_WEBHOOK_SECRET`.

## Events handled

- `payment_intent.succeeded` → mark order `paid` / `processing`
- `payment_intent.processing` → mark order `paid` / `processing`
- `payment_intent.payment_failed` → mark order `failed`

Orders are matched by `payment_intent_id`. Updates are idempotent.

## Stripe Dashboard setup

1. Set `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` in the API environment.
2. In Stripe → Developers → Webhooks → Add endpoint:
   - URL: `https://YOUR_DOMAIN/api/webhooks/stripe`
   - Events: the three `payment_intent.*` events above
3. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## Local testing with Stripe CLI

```bash
stripe listen --forward-to localhost:8000/api/webhooks/stripe
# Use the printed whsec_... as STRIPE_WEBHOOK_SECRET, then:
stripe trigger payment_intent.succeeded
```

If you terminate TLS at nginx/Cloudflare, keep forwarding the raw request body unchanged so signature verification succeeds.
