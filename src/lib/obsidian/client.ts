import "server-only";
import { Agent, fetch as undiciFetch } from "undici";

/**
 * A dedicated undici Agent (not the global fetch/dispatcher) so TLS verification
 * can be toggled for this one upstream connection only, and so Next's fetch-cache
 * layer (which we don't want against a mutable vault) is bypassed entirely.
 */
let dispatcher: Agent | undefined;
let dispatcherInsecureFlag: boolean | undefined;

function getDispatcher(): Agent {
  const insecure = process.env.OBSIDIAN_TLS_INSECURE === "true";
  if (!dispatcher || dispatcherInsecureFlag !== insecure) {
    dispatcher = new Agent({
      connect: { rejectUnauthorized: !insecure },
    });
    dispatcherInsecureFlag = insecure;
  }
  return dispatcher;
}

export class ObsidianConfigError extends Error {}

export class ObsidianApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ObsidianApiError";
    this.status = status;
    this.body = body;
  }
}

function getConfig(): { baseUrl: string; apiKey: string } {
  const baseUrl = process.env.OBSIDIAN_API_URL;
  const apiKey = process.env.OBSIDIAN_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new ObsidianConfigError(
      "OBSIDIAN_API_URL and OBSIDIAN_API_KEY must be set",
    );
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey };
}

export interface ObsidianRequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

/** Low-level proxy call: attaches the Bearer token server-side and returns the raw undici Response. */
export function obsidianFetch(path: string, init: ObsidianRequestInit = {}) {
  const { baseUrl, apiKey } = getConfig();
  return undiciFetch(`${baseUrl}${path}`, {
    method: init.method ?? "GET",
    body: init.body,
    signal: init.signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...init.headers,
    },
    dispatcher: getDispatcher(),
  });
}

async function throwObsidianError(
  path: string,
  method: string,
  response: {
    status: number;
    json: () => Promise<unknown>;
  },
): Promise<never> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  console.error(
    `[obsidian] ${method} ${path} -> ${response.status}`,
    body ?? "(no body)",
  );
  throw new ObsidianApiError(
    `Obsidian API request failed with status ${response.status}`,
    response.status,
    body,
  );
}

/** Calls obsidianFetch and parses a JSON response, throwing ObsidianApiError on non-2xx. */
export async function obsidianFetchJson<T>(
  path: string,
  init?: ObsidianRequestInit,
): Promise<T> {
  const response = await obsidianFetch(path, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });
  if (!response.ok) {
    await throwObsidianError(path, init?.method ?? "GET", response);
  }
  return (await response.json()) as T;
}

/** Calls obsidianFetch and returns the response body as text, throwing ObsidianApiError on non-2xx. */
export async function obsidianFetchText(
  path: string,
  init?: ObsidianRequestInit,
): Promise<string> {
  const response = await obsidianFetch(path, {
    ...init,
    headers: { Accept: "text/markdown", ...init?.headers },
  });
  if (!response.ok) {
    await throwObsidianError(path, init?.method ?? "GET", response);
  }
  return response.text();
}
