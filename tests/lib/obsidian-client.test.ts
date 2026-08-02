import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
const AgentMock = vi.fn(function MockAgent(this: { opts: unknown }, opts: unknown) {
  this.opts = opts;
});

vi.mock("undici", () => ({
  Agent: AgentMock,
  fetch: (...args: unknown[]) => fetchMock(...args),
}));

describe("obsidian client", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    process.env.OBSIDIAN_API_URL = "https://vault.example:27124";
    process.env.OBSIDIAN_API_KEY = "test-key";
    process.env.OBSIDIAN_TLS_INSECURE = "true";
  });

  afterEach(() => {
    delete process.env.OBSIDIAN_API_URL;
    delete process.env.OBSIDIAN_API_KEY;
    delete process.env.OBSIDIAN_TLS_INSECURE;
  });

  it("attaches the Bearer token and base URL", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ files: [] }),
    });
    const { obsidianFetchJson } = await import("@/lib/obsidian/client");
    await obsidianFetchJson("/vault/");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(url).toBe("https://vault.example:27124/vault/");
    expect(init.headers.Authorization).toBe("Bearer test-key");
  });

  it("throws ObsidianConfigError synchronously when env vars are missing", async () => {
    delete process.env.OBSIDIAN_API_URL;
    const { obsidianFetch, ObsidianConfigError } = await import("@/lib/obsidian/client");
    expect(() => obsidianFetch("/")).toThrow(ObsidianConfigError);
  });

  it("throws ObsidianApiError with status and body on a non-2xx response", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ errorCode: 40400, message: "Not found" }),
    });
    const { obsidianFetchJson, ObsidianApiError } = await import("@/lib/obsidian/client");
    await expect(obsidianFetchJson("/vault/missing.md")).rejects.toBeInstanceOf(ObsidianApiError);
    await expect(obsidianFetchJson("/vault/missing.md")).rejects.toMatchObject({ status: 404 });
  });

  it("passes rejectUnauthorized: false when OBSIDIAN_TLS_INSECURE=true", async () => {
    const { Agent } = await import("undici");
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    const { obsidianFetchJson } = await import("@/lib/obsidian/client");
    await obsidianFetchJson("/");
    expect(Agent).toHaveBeenCalledWith({ connect: { rejectUnauthorized: false } });
  });

  it("passes rejectUnauthorized: true when OBSIDIAN_TLS_INSECURE is unset", async () => {
    delete process.env.OBSIDIAN_TLS_INSECURE;
    const { Agent } = await import("undici");
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    const { obsidianFetchJson } = await import("@/lib/obsidian/client");
    await obsidianFetchJson("/");
    expect(Agent).toHaveBeenCalledWith({ connect: { rejectUnauthorized: true } });
  });
});
