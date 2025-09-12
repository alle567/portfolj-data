// src/app/api/billing/portal/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { getOrCreateCustomer } from "@/lib/getOrCreateCustomer";

export async function POST() {
  console.log("Portal API called");

  const { userId } = await auth();
  console.log("User ID:", userId);

  if (!userId) {
    console.log("No user ID found, returning unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Creating/getting customer...");
    const customer = await getOrCreateCustomer();
    console.log("Customer found:", customer.id);

    const customerId = customer.id;

    const returnUrl = process.env.NEXT_PUBLIC_APP_URL
      ? new URL("/billing", process.env.NEXT_PUBLIC_APP_URL).toString()
      : "http://localhost:3000/billing";

    console.log("Return URL:", returnUrl);
    console.log("Creating billing portal session...");

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    console.log("Portal session created:", session.id, session.url);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
