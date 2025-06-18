import { PackService, UserService } from "@/lib/backend/data/data-service"
import { headers } from "next/headers"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
const payments = await PackService.getAllPacks()

export async function POST(req: Request) {
  const body = await req.text()
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
        const clientReferenceId = session.client_reference_id!
        const decodedClientReferenceId = Buffer.from(clientReferenceId, 'base64').toString('utf-8')
        console.log("Decoded client reference ID:", decodedClientReferenceId)
        const paymentStripeID = session.payment_link
        if( !paymentStripeID) {
          console.error("Payment link not found in session:", session.id)
          return new Response("Payment link not found", { status: 400 })
        }

        const packBought = payments.find(pack => pack.stripeID === paymentStripeID)

        console.log("Payment link:", packBought)
        if (!packBought) {
          console.error("Pack not found for payment link:", paymentStripeID)
          return new Response("Pack not found", { status: 400 })
        }

        // Handle successful payment
        console.log("Payment successful for session:", session.id)

        // Simulate sending an order confirmation email
        console.log("Sending confirmation email to:", session.customer_details?.email)

        await UserService.registerPayment({
          method: "card",
          userID: decodedClientReferenceId,
          packID: packBought?.id || "",
          timestamp: new Date(),
        })
        let boughtCredits = packBought!.credits 
        if(packBought?.extraCredits) {
          boughtCredits = (packBought.credits || 0) + packBought?.extraCredits
        }
        await UserService.addCredits(decodedClientReferenceId, boughtCredits )

        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice

        // Handle subscription payment success
        // 1. Update subscription status in your database
        // 2. Grant access to subscription content
        // 3. Send subscription confirmation

        break
      }

        case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice

        // Handle subscription payment failure
        // 1. Notify customer
        // 2. Update subscription status

        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

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
