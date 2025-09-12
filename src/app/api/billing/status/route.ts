// src/app/api/billing/status/route.ts
export const runtime = "nodejs";

import StripeNS from "stripe"; // ⬅️ alias the Stripe types namespace
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { getOrCreateCustomer } from "@/lib/getOrCreateCustomer";

// Local aliases so nothing can shadow them
type StripeSubscription = StripeNS.Subscription;
type StripePaymentMethod = StripeNS.PaymentMethod;

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const customer = await getOrCreateCustomer();
    const customerId = (customer as any).id as string;

    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      expand: [
        "data.default_payment_method",
        "data.latest_invoice",
        "data.items",
      ],
      limit: 10,
    });

    // Narrow to an active-like subscription and keep the Stripe type
    const sub = subs.data.find(
      (s): s is StripeSubscription =>
        s.status === "active" ||
        s.status === "trialing" ||
        s.status === "past_due"
    );

    const plan = sub ? "pro" : "free";

    // --- Payment method (typed) ---
    let pm: StripePaymentMethod | null = null;

    // From the subscription (already expanded)
    if (
      sub?.default_payment_method &&
      typeof sub.default_payment_method !== "string"
    ) {
      pm = sub.default_payment_method;
    } else {
      // Fallback: load customer with expanded default PM
      try {
        const cust = await stripe.customers.retrieve(customerId, {
          expand: ["invoice_settings.default_payment_method"],
        });
        if (!("deleted" in cust)) {
          const def = cust.invoice_settings?.default_payment_method;
          if (def && typeof def !== "string") {
            pm = def;
          }
        }
      } catch (error) {
        console.error("Error retrieving customer payment method:", error);
        // Continue without payment method info
      }
    }

    const card =
      pm?.type === "card" && pm.card
        ? { brand: pm.card.brand, last4: pm.card.last4 }
        : null;

    // Extract current_period_end from subscription items
    const currentPeriodEnd = sub?.items?.data?.[0]?.current_period_end ?? null;

    return NextResponse.json({
      plan,
      subscriptionStatus: sub?.status ?? null,
      currentPeriodEnd: currentPeriodEnd, // unix seconds
      cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
      canceledAt: sub?.canceled_at ?? null, // unix seconds if canceled
      paymentMethod: card,
    });
  } catch (error) {
    console.error("Billing status error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve billing status" },
      { status: 500 }
    );
  }
}
