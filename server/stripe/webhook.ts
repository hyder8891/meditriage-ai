import type { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "../db";
import { subscriptions, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Handle Stripe webhook events
 * CRITICAL: This route must use express.raw() middleware, not express.json()
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Webhook] Missing stripe-signature header");
    return res.status(400).send("Missing signature");
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  // CRITICAL: Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  // Handle different event types
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`[Webhook] Error processing event ${event.type}:`, error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Handle checkout.session.completed
 * Create new subscription record when payment succeeds
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("[Webhook] Processing checkout.session.completed");

  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;
  const userRole = session.metadata?.user_role;

  if (!userId || !planId) {
    console.error("[Webhook] Missing metadata in checkout session");
    return;
  }

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database unavailable");
    return;
  }

  // Get subscription details from Stripe
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    // Create subscription record
    await db.insert(subscriptions).values({
      userId: userId,
      planType: planId,
      status: "active",
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: false,
      metadata: JSON.stringify({
        plan_id: planId,
        user_role: userRole,
      }),
    });

    // Update user's Stripe customer ID
    await db
      .update(users)
      .set({ stripeCustomerId: session.customer as string })
      .where(eq(users.id, userId));

    console.log(`[Webhook] Created subscription for user ${userId}, plan ${planId}`);
  }
}

/**
 * Handle customer.subscription.updated
 * Update subscription status and period
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("[Webhook] Processing subscription update");

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database unavailable");
    return;
  }

  // Map Stripe status to our enum (Stripe uses "canceled", we use "cancelled")
  const mappedStatus = subscription.status === "canceled" ? "cancelled" : subscription.status;
  
  await db
    .update(subscriptions)
    .set({
      status: mappedStatus as "active" | "trialing" | "past_due" | "cancelled" | "expired",
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

  console.log(`[Webhook] Updated subscription ${subscription.id}`);
}

/**
 * Handle customer.subscription.deleted
 * Mark subscription as cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("[Webhook] Processing subscription deletion");

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database unavailable");
    return;
  }

  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

  console.log(`[Webhook] Cancelled subscription ${subscription.id}`);
}

/**
 * Handle invoice.paid
 * Log successful payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`[Webhook] Invoice paid: ${invoice.id}`);
  // Could log payment history here if needed
}

/**
 * Handle invoice.payment_failed
 * Handle failed payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.error(`[Webhook] Payment failed for invoice: ${invoice.id}`);
  
  const db = await getDb();
  if (!db) return;

  // Could update subscription status or send notification
  const subscriptionId = (invoice as any).subscription;
  if (subscriptionId) {
    await db
      .update(subscriptions)
      .set({ status: "past_due" })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId as string));
  }
}
