import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }
  // Avoid hammering the backend with guesses. Return 501 until backend exposes this.
  return NextResponse.json(
    { error: "Quote endpoint not implemented in backend yet" },
    { status: 501 }
  );
}
