import { headers } from "next/headers"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

const payments = {
  "plink_1RYy5UCls50jHir3ESdel7xA" : "standard"
}


export async function POST(req: Request) {
  const body = await req.text()
  console.log(body)
  if (!body) {
    return new Response("No body found", { status: 400 })
  }
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return new Response("No signature found", { status: 400 })
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("session",session)
        const clientReferenceId = session.client_reference_id!
        const decodedClientReferenceId = Buffer.from(clientReferenceId, 'base64').toString('utf-8')
        console.log("Decoded client reference ID:", decodedClientReferenceId)
        const payment_link = session.payment_link
        if( !payment_link) {
          console.error("Payment link not found in session:", session.id)
          return new Response("Payment link not found", { status: 400 })
        }

        const paymentType = payments.plink_1RYy5UCls50jHir3ESdel7xA

        console.log("Payment link:", paymentType)

        // Handle successful payment
        console.log("Payment successful for session:", session.id)

        // Simulate sending an order confirmation email
        console.log("Sending confirmation email to:", session.customer_details?.email)

        // Here you would typically:
        // 1. Update order status in your database
        // 2. Send confirmation email
        // 3. Trigger order fulfillment
        // 4. Update inventory

        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        console.log(invoice)
        console.log("Subscription invoice paid:", invoice.id)

        // Handle subscription payment success
        // 1. Update subscription status in your database
        // 2. Grant access to subscription content
        // 3. Send subscription confirmation

        break
      }

        case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        console.log("Subscription payment failed:", invoice.id)

        // Handle subscription payment failure
        // 1. Notify customer
        // 2. Update subscription status

        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        console.log("Subscription canceled:", subscription.id)

        // Handle subscription cancellation
        // 1. Update user access
        // 2. Send cancellation confirmation

        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("❌ Payment failed:", paymentIntent.id)
        break
      }
    }

    return new Response(null, { status: 200 })
  } catch (err) {
    console.error("Webhook error:", err)
    return new Response("Webhook error: " + (err instanceof Error ? err.message : "Unknown error"), { status: 400 })
  }
}
