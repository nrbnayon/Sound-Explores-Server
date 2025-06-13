// src/app/constants/subscriptionPlans.ts
export const SUBSCRIPTION_PLANS = {
  premium: {
    name: "Premium",
    price: 3.99,
    priceId:
      process.env.STRIPE_PREMIUM_PRICE_ID || "price_1RZNFAFowt6kkQS91qbbwjJr",
    features: ["Unlimited access", "Premium features", "Priority support"],
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;
