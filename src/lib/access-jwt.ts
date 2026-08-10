import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Verification is opt-in: both env vars must be set. This keeps LAN-only deploys and
 * `npm run dev:mock` working unauthenticated, matching how OBSIDIAN_TLS_INSECURE etc.
 * are handled elsewhere — presence of config, not a separate feature flag, decides.
 */
export function isAccessAuthEnabled(): boolean {
  return Boolean(process.env.CF_ACCESS_TEAM_DOMAIN && process.env.CF_ACCESS_AUD);
}

/**
 * True only when exactly one of the two env vars is set — e.g. a typo in one of them
 * in the Portainer stack config. Callers must fail closed on this, not just treat it
 * as "disabled": since this app has no other auth, silently disabling Access on a
 * typo would expose the whole vault to the internet.
 */
export function isAccessAuthMisconfigured(): boolean {
  return Boolean(process.env.CF_ACCESS_TEAM_DOMAIN) !== Boolean(process.env.CF_ACCESS_AUD);
}

// Cached at module scope (persists across requests in the same Edge isolate) so we
// don't refetch Cloudflare's JWKS on every request. Domain and set always change
// together, so they're one cache entry rather than two independent variables.
let jwksCache: { teamDomain: string; jwks: ReturnType<typeof createRemoteJWKSet> } | undefined;

function getJwks(teamDomain: string) {
  if (!jwksCache || jwksCache.teamDomain !== teamDomain) {
    jwksCache = {
      teamDomain,
      jwks: createRemoteJWKSet(
        new URL(`https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`),
      ),
    };
  }
  return jwksCache.jwks;
}

/** Verifies a Cf-Access-Jwt-Assertion token; throws if missing config, token, or invalid signature/claims. */
export async function verifyAccessJwt(token: string | null): Promise<void> {
  if (!isAccessAuthEnabled()) {
    throw new Error("Cloudflare Access is not configured");
  }
  if (!token) {
    throw new Error("Missing Cf-Access-Jwt-Assertion");
  }
  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN as string;
  const aud = process.env.CF_ACCESS_AUD as string;
  await jwtVerify(token, getJwks(teamDomain), {
    issuer: `https://${teamDomain}.cloudflareaccess.com`,
    audience: aud,
  });
}
