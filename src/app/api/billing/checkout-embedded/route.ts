export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { getOrCreateCustomer } from "@/lib/getOrCreateCustomer";

export async function POST(req: Request) {
  console.log("Embedded checkout API called");

  const { userId } = await auth();
  console.log("User ID:", userId);

  if (!userId) {
    console.log("No user ID found, returning unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Creating customer...");
    const customer = await getOrCreateCustomer();
    console.log("Customer created/found:", customer.id);

    const customerId = customer.id;
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

    console.log("Creating Stripe checkout session...");
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_PRO_MONTH!, quantity: 1 }],
      allow_promotion_codes: true,
      client_reference_id: userId,
      ui_mode: "embedded",
      redirect_on_completion: "never",
    });

    console.log("Session created successfully:", session.id);
    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Embedded checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create embedded checkout session" },
      { status: 500 }
    );
  }
}
