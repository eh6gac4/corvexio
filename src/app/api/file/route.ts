import { NextRequest, NextResponse } from "next/server";
import { obsidianFetch, obsidianFetchText } from "@/lib/obsidian/client";
import { encodeVaultPath } from "@/lib/obsidian/paths";
import { apiErrorResponse, ApiError } from "@/lib/api-error";
import type { FileContent } from "@/types/vault";

function requirePath(request: NextRequest): string {
  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    throw new ApiError("Missing required 'path' query parameter", 400);
  }
  return path;
}

export async function GET(request: NextRequest) {
  try {
    const path = requirePath(request);
    const content = await obsidianFetchText(`/vault/${encodeVaultPath(path)}`);
    const body: FileContent = { path, content };
    return NextResponse.json(body);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const path = requirePath(request);
    const { content } = (await request.json()) as { content: string };
    const response = await obsidianFetch(`/vault/${encodeVaultPath(path)}`, {
      method: "PUT",
      headers: { "Content-Type": "text/markdown" },
      body: content,
    });
    if (!response.ok) {
      throw new ApiError(`Upstream save failed (${response.status})`, response.status);
    }
    return NextResponse.json({ path } satisfies { path: string });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const path = requirePath(request);
    const response = await obsidianFetch(`/vault/${encodeVaultPath(path)}`, {
      method: "DELETE",
    });
    if (!response.ok && response.status !== 404) {
      throw new ApiError(`Upstream delete failed (${response.status})`, response.status);
    }
    return NextResponse.json({ path } satisfies { path: string });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/**
 * Plumbed for future partial edits (heading/block/frontmatter targeting) but not
 * called by the MVP UI, which always saves the whole file via PUT.
 */
const FORWARDED_PATCH_HEADERS = [
  "operation",
  "target-type",
  "target",
  "target-delimiter",
  "target-scope",
  "create-target-if-missing",
  "reject-if-content-preexists",
  "content-type",
];

export async function PATCH(request: NextRequest) {
  try {
    const path = requirePath(request);
    const headers: Record<string, string> = {};
    for (const name of FORWARDED_PATCH_HEADERS) {
      const value = request.headers.get(name);
      if (value) headers[name] = value;
    }
    const body = await request.text();
    const response = await obsidianFetch(`/vault/${encodeVaultPath(path)}`, {
      method: "PATCH",
      headers,
      body,
    });
    const resultText = await response.text();
    if (!response.ok) {
      throw new ApiError(`Upstream patch failed (${response.status})`, response.status);
    }
    return new NextResponse(resultText, { status: response.status });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
