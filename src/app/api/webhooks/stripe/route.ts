// src/app/api/webhooks/stripe/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";

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

  try {
    const cc = await clerkClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkUserId = session.client_reference_id ?? undefined;
        const customerId = (session.customer as string) ?? undefined;

        if (clerkUserId && customerId) {
          await cc.users.updateUser(clerkUserId, {
            privateMetadata: { stripeCustomerId: customerId, plan: "pro" },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const cust = await stripe.customers.retrieve(sub.customer as string);
        if (!("deleted" in cust)) {
          const clerkUserId = cust.metadata?.clerkUserId;
          if (clerkUserId) {
            await cc.users.updateUser(clerkUserId, {
              privateMetadata: { plan: "free" },
            });
          }
        }
        break;
      }

      // Optional: keep plan in sync on create/update, only when active/trialing
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        if (sub.status === "active" || sub.status === "trialing") {
          const cust = await stripe.customers.retrieve(sub.customer as string);
          if (!("deleted" in cust)) {
            const clerkUserId = cust.metadata?.clerkUserId;
            if (clerkUserId) {
              await cc.users.updateUser(clerkUserId, {
                privateMetadata: { plan: "pro" },
              });
            }
          }
        }
        break;
      }

      default:
        // ignore other events
        break;
    }
  } catch (err) {
    // Log and still 200 so Stripe doesn't retry forever on our bug
    console.error("Stripe webhook handler error:", err);
  }

  return NextResponse.json({ ok: true });
}
