// src/app/api/fin/search/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  // Prefer IPv4 loopback to avoid ::1 resolution issues on localhost
  const base =
    (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) ||
    "http://127.0.0.1:8000";

  const baseClean = base.endsWith("/") ? base.slice(0, -1) : base;
  const url = new URL("/v1/search", baseClean);
  url.searchParams.set("q", q);

  try {
    const r = await fetch(url.toString(), {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    const body = await r
      .json()
      .catch(() => ({ error: "Upstream returned non-JSON response" }));

    if (!r.ok) {
      return NextResponse.json(
        {
          error:
            (body as any)?.error ||
            `Upstream error ${r.status} ${r.statusText}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(body);
  } catch (err: any) {
    // Friendlier message for common local dev failure
    const message =
      err?.cause?.code === "ECONNREFUSED"
        ? `Cannot reach backend at ${baseClean}. Is it running and listening on IPv4?`
        : err?.message || "Fetch to backend failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
