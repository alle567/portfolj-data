import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  const range = req.nextUrl.searchParams.get("range");
  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }
  // Avoid backend 404 spam until prices exist server-side.
  return NextResponse.json(
    { error: "Prices endpoint not implemented in backend yet" },
    { status: 501 }
  );
}
