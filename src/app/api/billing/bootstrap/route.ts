// src/app/api/billing/bootstrap/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await currentUser();
    const pm = ((user?.privateMetadata as any) || {}) as Record<
      string,
      unknown
    >;

    if (pm.plan !== "free" && pm.plan !== "pro") {
      const cc = await clerkClient();
      await cc.users.updateUser(userId, {
        privateMetadata: { ...pm, plan: "free" },
      });
      return NextResponse.json({ ok: true, plan: "free" });
    }

    return NextResponse.json({ ok: true, plan: pm.plan || "free" });
  } catch (error) {
    console.error("Bootstrap error:", error);
    return NextResponse.json(
      { error: "Failed to bootstrap user" },
      { status: 500 }
    );
  }
}
