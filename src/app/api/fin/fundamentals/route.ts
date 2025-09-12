import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }
  // Avoid backend 404 spam until fundamentals exist server-side.
  return NextResponse.json(
    { error: "Fundamentals endpoint not implemented in backend yet" },
    { status: 501 }
  );
}
