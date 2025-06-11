// src/app/types/subscription.types.ts
export interface SubscriptionPlan {
  plan: "premium";
  price: number;
  priceId: string; // Stripe Price ID
  features: string[];
}

export interface CreateSubscriptionRequest {
  plan: "premium";
  price: number;
  paymentMethodId?: string;
}

export interface SubscriptionResponse {
  subscriptionId: string;
  clientSecret?: string;
  status: string;
  currentPeriodEnd: Date;
  plan: string;
  price: number;
  requiresAction?: boolean;
  paymentIntentStatus?: string;
}

// Stripe webhook event types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}
