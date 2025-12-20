/**
 * Stripe Product and Price Configuration
 * 
 * This file defines all subscription plans for the B2B2C platform.
 * Patient plans: Free (no Stripe), Lite ($2.99/mo), Pro ($5.99/mo)
 * Doctor plans: Basic ($120/mo), Premium ($200/mo)
 */

export const PATIENT_PLANS = {
  free: {
    id: "free",
    name: "Free Plan",
    price: 0,
    priceId: null, // No Stripe price for free plan
    features: {
      consultationsLimit: 3,
      doctorConnectionsLimit: 1,
    },
  },
  lite: {
    id: "lite",
    name: "Lite Plan",
    price: 2.99,
    priceId: process.env.STRIPE_PRICE_PATIENT_LITE || "price_patient_lite", // Replace with actual Stripe Price ID
    features: {
      consultationsLimit: 10,
      doctorConnectionsLimit: 2,
    },
  },
  pro: {
    id: "pro",
    name: "Pro Plan",
    price: 5.99,
    priceId: process.env.STRIPE_PRICE_PATIENT_PRO || "price_patient_pro", // Replace with actual Stripe Price ID
    features: {
      consultationsLimit: -1, // unlimited
      doctorConnectionsLimit: -1, // unlimited
    },
  },
};

export const DOCTOR_PLANS = {
  basic: {
    id: "basic",
    name: "Basic Plan",
    price: 120,
    priceId: process.env.STRIPE_PRICE_DOCTOR_BASIC || "price_doctor_basic", // Replace with actual Stripe Price ID
    features: {
      patientsLimit: 100,
    },
  },
  premium: {
    id: "premium",
    name: "Premium Plan",
    price: 200,
    priceId: process.env.STRIPE_PRICE_DOCTOR_PREMIUM || "price_doctor_premium", // Replace with actual Stripe Price ID
    features: {
      patientsLimit: -1, // unlimited
    },
  },
};

/**
 * Get plan configuration by ID
 */
export function getPlanById(planId: string, userRole: "patient" | "doctor" | "clinician") {
  if (userRole === "patient") {
    return PATIENT_PLANS[planId as keyof typeof PATIENT_PLANS];
  } else {
    return DOCTOR_PLANS[planId as keyof typeof DOCTOR_PLANS];
  }
}

/**
 * Get Stripe Price ID for a plan
 */
export function getStripePriceId(planId: string, userRole: "patient" | "doctor" | "clinician"): string | null {
  const plan = getPlanById(planId, userRole);
  return plan?.priceId || null;
}
