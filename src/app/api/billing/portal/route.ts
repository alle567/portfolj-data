// src/app/api/billing/portal/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, currentUser } from "@clerk/nextjs/server";

// ⬇️ remove the apiVersion option
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const customerId = (user?.privateMetadata as any)?.stripeCustomerId as
    | string
    | undefined;
  if (!customerId) {
    return NextResponse.json(
      { error: "No Stripe customer on file" },
      { status: 400 }
    );
  }

  const returnUrl = process.env.NEXT_PUBLIC_APP_URL
    ? new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL).toString()
    : "http://localhost:3000/dashboard";

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: session.url });
}
