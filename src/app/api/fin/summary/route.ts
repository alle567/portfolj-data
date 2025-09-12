import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.BACKEND_URL;

export async function POST(req: NextRequest) {
  if (!BASE) {
    return NextResponse.json({ error: "BACKEND_URL not set" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const { accession, question, max_chunks } = body || {};
  if (!accession || !question) {
    return NextResponse.json(
      { error: "accession and question are required" },
      { status: 400 }
    );
  }

  // Try plural then singular; return on first success; only 404 falls through.
  const candidates = [
    `${BASE}/v1/filings/${encodeURIComponent(accession)}/summary`,
    `${BASE}/v1/filing/${encodeURIComponent(accession)}/summary`,
  ];

  for (const url of candidates) {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ question, max_chunks }),
    });

    const j = await r.json().catch(() => ({}));

    if (r.ok) {
      const summary = j?.summary ?? j?.answer ?? j?.text ?? "";
      return NextResponse.json({ summary });
    }
    if (r.status !== 404) {
      return NextResponse.json(
        { error: j?.error || "Backend error" },
        { status: r.status }
      );
    }
  }

  return NextResponse.json(
    { error: "Summary endpoint not found in backend" },
    { status: 501 }
  );
}
