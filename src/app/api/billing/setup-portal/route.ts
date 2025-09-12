export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    console.log("Creating billing portal configuration...");

    const configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: "InvestApp Billing",
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ["email", "address"],
        },
        payment_method_update: {
          enabled: true,
        },
        subscription_cancel: {
          enabled: true,
          mode: "at_period_end",
        },
        subscription_update: {
          enabled: false, // Disable for now since you only have one plan
        },
        invoice_history: {
          enabled: true,
        },
      },
    });

    console.log("Portal configuration created:", configuration.id);

    return NextResponse.json({
      success: true,
      configurationId: configuration.id,
      message: "Billing portal configuration created successfully!",
    });
  } catch (error) {
    console.error("Configuration creation error:", error);
    return NextResponse.json(
      { error: "Failed to create portal configuration" },
      { status: 500 }
    );
  }
}

export async function POST() {
  // Same logic for POST requests
  return GET();
}
