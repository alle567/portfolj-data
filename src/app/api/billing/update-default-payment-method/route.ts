export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { getOrCreateCustomer } from "@/lib/getOrCreateCustomer";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { payment_method_id } = await request.json();

    if (!payment_method_id) {
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 }
      );
    }

    const customer = await getOrCreateCustomer();

    // Update the customer's default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: payment_method_id,
      },
    });

    // Also update any active subscription to use this payment method
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      await stripe.subscriptions.update(subscriptions.data[0].id, {
        default_payment_method: payment_method_id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update default payment method error:", error);
    return NextResponse.json(
      { error: "Failed to update default payment method" },
      { status: 500 }
    );
  }
}
