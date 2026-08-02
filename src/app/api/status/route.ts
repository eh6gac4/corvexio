import { NextResponse } from "next/server";
import { obsidianFetch } from "@/lib/obsidian/client";
import type { StatusResult } from "@/types/vault";

export async function GET() {
  try {
    const response = await obsidianFetch("/", { signal: AbortSignal.timeout(3000) });
    return NextResponse.json({ ok: response.ok } satisfies StatusResult);
  } catch {
    return NextResponse.json({ ok: false } satisfies StatusResult);
  }
}
