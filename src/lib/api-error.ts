import { NextResponse } from "next/server";
import { ObsidianApiError, ObsidianConfigError } from "@/lib/obsidian/client";

/** Validation/usage errors raised by our own route handlers (e.g. missing query params). */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ObsidianConfigError) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (error instanceof ObsidianApiError) {
    return NextResponse.json(
      { error: error.message, upstream: error.body },
      { status: error.status },
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Unexpected error" }, { status: 502 });
}
