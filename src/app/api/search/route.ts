import { NextRequest, NextResponse } from "next/server";
import { obsidianFetchJson } from "@/lib/obsidian/client";
import { apiErrorResponse, ApiError } from "@/lib/api-error";
import type { ObsidianSearchSimpleResult } from "@/lib/obsidian/types";
import type { SearchResultItem } from "@/types/vault";

export async function POST(request: NextRequest) {
  try {
    const { query, contextLength } = (await request.json()) as {
      query?: string;
      contextLength?: number;
    };
    if (!query || !query.trim()) {
      throw new ApiError("Missing required 'query'", 400);
    }

    // Upstream takes query/contextLength as URL query params on a POST, not a JSON body.
    const params = new URLSearchParams({ query });
    if (contextLength) params.set("contextLength", String(contextLength));

    const results = await obsidianFetchJson<ObsidianSearchSimpleResult[]>(
      `/search/simple/?${params.toString()}`,
      { method: "POST" },
    );

    const items: SearchResultItem[] = results.map((result) => ({
      path: result.filename,
      score: result.score,
      matches: result.matches.map((m) => ({
        context: m.context,
        start: m.match.start,
        end: m.match.end,
      })),
    }));

    return NextResponse.json(items);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
