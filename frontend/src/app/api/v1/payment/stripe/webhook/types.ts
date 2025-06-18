import type { Stripe } from "stripe"

export interface WebhookEvent {
  id: string
  object: "event"
  api_version: string
  created: number
  data: {
    object: Stripe.Checkout.Session | Stripe.PaymentIntent | Stripe.Invoice | Stripe.Subscription
  }
  livemode: boolean
  pending_webhooks: number
  request: {
    id: string | null
    idempotency_key: string | null
  }
  type:
    | "checkout.session.completed"
    | "payment_intent.payment_failed"
    | "invoice.paid"
    | "invoice.payment_failed"
    | "customer.subscription.deleted"

}