import { NextResponse } from "next/server";

/** Container healthcheck. Must not depend on the Obsidian backend being reachable. */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
