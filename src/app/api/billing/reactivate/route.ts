export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { getOrCreateCustomer } from "@/lib/getOrCreateCustomer";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const customer = await getOrCreateCustomer();
    console.log("Customer found:", customer.id);

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 1,
    });

    console.log("Subscriptions found:", subscriptions.data.length);

    if (subscriptions.data.length === 0) {
      console.log("No active subscription found for customer:", customer.id);
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    const subscription = subscriptions.data[0];
    console.log("Subscription details:", {
      id: subscription.id,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
    });

    // Check if subscription is set to cancel at period end
    if (!subscription.cancel_at_period_end) {
      console.log("Subscription is not set to cancel");
      return NextResponse.json(
        { error: "Subscription is not set to cancel" },
        { status: 400 }
      );
    }

    // Reactivate the subscription by setting cancel_at_period_end to false
    console.log("Attempting to reactivate subscription:", subscription.id);
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.id,
      {
        cancel_at_period_end: false,
      }
    );

    console.log("Subscription reactivated successfully:", {
      id: updatedSubscription.id,
      cancel_at_period_end: updatedSubscription.cancel_at_period_end,
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        current_period_end: (updatedSubscription as any).current_period_end,
      },
    });
  } catch (error) {
    console.error("Error reactivating subscription:", error);
    return NextResponse.json(
      { error: "Failed to reactivate subscription" },
      { status: 500 }
    );
  }
}
