import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.BACKEND_URL;

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }
  if (!BASE) {
    return NextResponse.json({ error: "BACKEND_URL not set" }, { status: 500 });
  }

  const url = `${BASE}/v1/companies/${encodeURIComponent(ticker)}/filings`;

  const r = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const j = await r.json().catch(() => ({}));

  if (!r.ok) {
    return NextResponse.json(
      { error: j?.error || "Backend error" },
      { status: r.status }
    );
  }

  // Normalize to { results: Filing[] }
  const results = Array.isArray((j as any)?.results)
    ? (j as any).results
    : Array.isArray((j as any)?.filings)
    ? (j as any).filings
    : Array.isArray(j)
    ? (j as any)
    : [];

  return NextResponse.json({ results });
}
