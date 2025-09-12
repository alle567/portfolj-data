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
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create a setup session for updating payment method
    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: customer.id,
      success_url: `${origin}/billing?payment_updated=1`,
      cancel_url: `${origin}/billing`,
      payment_method_types: ["card"],
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Update payment method error:", error);
    return NextResponse.json(
      { error: "Failed to create payment update session" },
      { status: 500 }
    );
  }
}
