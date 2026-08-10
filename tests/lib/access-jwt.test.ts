// @vitest-environment node
// jsdom's Uint8Array is a distinct realm from Node's, and jose's internal
// `instanceof Uint8Array` checks fail across that boundary — this file needs the
// real Node environment (middleware/Edge code has no jsdom globals anyway).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

const TEAM_DOMAIN = "test-team";
const AUD = "test-audience";
const ISSUER = `https://${TEAM_DOMAIN}.cloudflareaccess.com`;
const KID = "test-key";

async function setUpKeys() {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = await exportJWK(publicKey);
  const fetchMock = async (url: string | URL) => {
    expect(String(url)).toBe(`${ISSUER}/cdn-cgi/access/certs`);
    return new Response(JSON.stringify({ keys: [{ ...jwk, kid: KID, alg: "RS256", use: "sig" }] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  return { privateKey, fetchMock };
}

async function signToken(privateKey: CryptoKey, overrides: Partial<{ aud: string; iss: string; exp: string }> = {}) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid: KID })
    .setIssuedAt()
    .setIssuer(overrides.iss ?? ISSUER)
    .setAudience(overrides.aud ?? AUD)
    .setExpirationTime(overrides.exp ?? "5m")
    .sign(privateKey);
}

describe("access-jwt", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // access-jwt.ts caches the JWKS at module scope; reset so each test (which mints
    // its own key pair) gets a fresh fetch instead of a stale cached key set.
    vi.resetModules();
    process.env.CF_ACCESS_TEAM_DOMAIN = TEAM_DOMAIN;
    process.env.CF_ACCESS_AUD = AUD;
  });

  afterEach(() => {
    delete process.env.CF_ACCESS_TEAM_DOMAIN;
    delete process.env.CF_ACCESS_AUD;
    globalThis.fetch = originalFetch;
  });

  it("is disabled unless both env vars are set", async () => {
    const { isAccessAuthEnabled } = await import("@/lib/access-jwt");
    expect(isAccessAuthEnabled()).toBe(true);

    delete process.env.CF_ACCESS_AUD;
    expect(isAccessAuthEnabled()).toBe(false);
  });

  it("accepts a token with a valid signature, issuer, and audience", async () => {
    const { privateKey, fetchMock } = await setUpKeys();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { verifyAccessJwt } = await import("@/lib/access-jwt");

    const token = await signToken(privateKey);
    await expect(verifyAccessJwt(token)).resolves.toBeUndefined();
  });

  it("rejects a missing token", async () => {
    const { verifyAccessJwt } = await import("@/lib/access-jwt");
    await expect(verifyAccessJwt(null)).rejects.toThrow();
  });

  it("rejects a token with the wrong audience", async () => {
    const { privateKey, fetchMock } = await setUpKeys();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { verifyAccessJwt } = await import("@/lib/access-jwt");

    const token = await signToken(privateKey, { aud: "someone-elses-app" });
    await expect(verifyAccessJwt(token)).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    const { privateKey, fetchMock } = await setUpKeys();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { verifyAccessJwt } = await import("@/lib/access-jwt");

    const token = await signToken(privateKey, { exp: "-1s" });
    await expect(verifyAccessJwt(token)).rejects.toThrow();
  });

  it("rejects a token signed by an untrusted key", async () => {
    const { fetchMock } = await setUpKeys();
    const { privateKey: otherKey } = await generateKeyPair("RS256");
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { verifyAccessJwt } = await import("@/lib/access-jwt");

    const token = await signToken(otherKey);
    await expect(verifyAccessJwt(token)).rejects.toThrow();
  });
});
