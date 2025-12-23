import Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { getStripePriceId } from "./products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export interface CreateCheckoutSessionParams {
  planId: string;
  userRole: "patient" | "doctor" | "clinician";
  userId: string;
  userEmail: string;
  userName: string;
  origin: string;
}

/**
 * Create a Stripe Checkout Session for subscription payment
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<string> {
  const { planId, userRole, userId, userEmail, userName, origin } = params;

  // Get Stripe Price ID
  const priceId = getStripePriceId(planId, userRole);
  
  if (!priceId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid plan or free plan selected",
    });
  }

  try {
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        customer_email: userEmail,
        customer_name: userName,
        plan_id: planId,
        user_role: userRole,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_id: planId,
          user_role: userRole,
        },
      },
      success_url: `${origin}/${userRole === "patient" ? "patient" : "clinician"}/subscription?success=true`,
      cancel_url: `${origin}/${userRole === "patient" ? "patient" : "clinician"}/subscription?canceled=true`,
      allow_promotion_codes: true,
    });

    return session.url!;
  } catch (error) {
    console.error("[Stripe] Checkout session creation failed:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create checkout session",
    });
  }
}

/**
 * Create a portal session for managing existing subscriptions
 */
export async function createPortalSession(customerId: string, origin: string): Promise<string> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/subscription`,
    });

    return session.url;
  } catch (error) {
    console.error("[Stripe] Portal session creation failed:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create portal session",
    });
  }
}
