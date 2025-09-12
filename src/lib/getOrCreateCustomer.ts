// src/lib/getOrCreateCustomer.ts
import { currentUser, auth, clerkClient } from "@clerk/nextjs/server";
import { stripe } from "./stripe";

export async function getOrCreateCustomer() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const pm = (user?.privateMetadata || {}) as Record<string, any>;

  const cc = await clerkClient();

  // return existing
  if (pm.stripeCustomerId) {
    return await stripe.customers.retrieve(pm.stripeCustomerId as string);
  }

  // create new
  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: { clerkUserId: userId },
  });

  await cc.users.updateUser(userId, {
    privateMetadata: { ...pm, stripeCustomerId: customer.id, plan: "free" },
  });

  return customer;
}
