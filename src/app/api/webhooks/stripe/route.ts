// src/app/api/webhooks/stripe/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        error: `Webhook signature verification failed: ${err?.message ?? err}`,
      },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const clerkUserId = session.client_reference_id ?? undefined; // set this when creating Checkout
    const customerId = (session.customer as string) ?? undefined;

    if (clerkUserId && customerId) {
      const client = await clerkClient(); // <-- get the client instance
      await client.users.updateUser(clerkUserId, {
        privateMetadata: { stripeCustomerId: customerId },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
