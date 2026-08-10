# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Corvexio is a mobile-friendly Next.js (App Router) web frontend for editing an
[Obsidian](https://obsidian.md) vault over its
[Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) plugin. All calls to
the Obsidian API are proxied through server-side Route Handlers (`src/app/api/*`) so the API key
never reaches the browser.

MVP scope, intentionally: full-text search only (no tag/backlink browsing), whole-file save via
`PUT` (no autosave, no `PATCH`-based partial edits in the UI — though `PATCH` is plumbed through
`/api/file` for future use).

## Commands

```bash
npm install
npm run dev:mock   # mock Obsidian server (https://127.0.0.1:27124) + `next dev`, concurrently
npm run dev        # next dev only — needs .env.local pointing at a real vault
npm test           # vitest run (all tests)
npm run test:watch # vitest watch mode
npm run build      # type-checks and builds the production bundle (tsc via next build)
npm run lint       # eslint .
```

Run a single test file or test case with vitest directly, e.g.:

```bash
npx vitest run tests/lib/obsidian-client.test.ts
npx vitest run -t "attaches the Bearer token"
```

No real Obsidian instance is required for development. `npm run dev:mock` runs
`scripts/mock-obsidian-server.ts`, a standalone HTTPS mock of the Local REST API backed by
`fixtures/vault/*.md`. `.env.development` (committed, non-secret) already points `next dev` at it.
To develop against a real vault, copy `.env.local.example` to `.env.local` and fill in
`OBSIDIAN_API_URL`/`OBSIDIAN_API_KEY` from Obsidian → Settings → Local REST API, then `npm run dev`.

Docker build: `docker build -t corvexio .` (multi-stage, `output: "standalone"`).
Deployed on the N100 as a Portainer "Git repository" stack — Portainer clones this repo fresh per
deploy, so `OBSIDIAN_API_URL`/`OBSIDIAN_API_KEY`/`OBSIDIAN_TLS_INSECURE` are set as stack
environment variables in the Portainer UI rather than an `.env.production` file. For a local
`docker compose up`, put the same three vars in a gitignored `.env` (base it on
`.env.local.example`). `/api/health` never depends on the Obsidian backend being reachable, so a
temporarily unreachable vault/VPN won't crash-loop the container.

## Architecture

**Request flow:** browser component → `src/lib/api-client.ts` (`"use client"`, calls same-origin
`/api/*`) → `src/app/api/*/route.ts` (Route Handler) → `src/lib/obsidian/client.ts` → upstream
Obsidian Local REST API. Client components never call the Obsidian API directly.

- **`src/lib/obsidian/client.ts`** — the only module that reads `OBSIDIAN_API_KEY`. Marked
  `import "server-only"` (line 1), so importing it from client code is a build error. Uses a
  dedicated `undici` `Agent` (not global `fetch`) so TLS verification (`OBSIDIAN_TLS_INSECURE`,
  for the Local REST API's self-signed cert) is scoped to this one upstream connection, and so
  Next's fetch-cache layer (unwanted against a mutable vault) is bypassed entirely. Exports
  `obsidianFetch` (raw), `obsidianFetchJson`, `obsidianFetchText`, and the `ObsidianConfigError` /
  `ObsidianApiError` error classes.
- **`src/lib/obsidian/paths.ts`** — vault path helpers. Segments are percent-encoded individually
  and rejoined (not the whole path as one string), since that would also escape `/` separators.
- **`src/lib/obsidian/types.ts`** — raw upstream response shapes from the Obsidian API.
- **`src/types/vault.ts`** — shapes shared between our own `/api/*` routes and the frontend
  (`TreeEntry`, `FileContent`, `SearchResultItem`, `StatusResult`). Route handlers translate
  `obsidian/types.ts` shapes into these before responding.
- **`src/app/api/*`** — thin Route Handlers that call `obsidianFetch*`, translate errors via
  `apiErrorResponse` (`src/lib/api-error.ts`), and return the shared types above.
  - `tree` — lists a vault directory, sorts directories first then alphabetically.
  - `file` — GET/PUT/DELETE a single file (whole-file content); PATCH is plumbed through
    (`src/app/api/file/route.ts:63-96`) for future partial edits but unused by the UI.
  - `search` — wraps `/search/simple/`; note the upstream takes `query`/`contextLength` as URL
    query params on a POST, not a JSON body.
  - `status` — pings the upstream with a 3s timeout, never throws (used for the connectivity
    banner).
  - `health` — container healthcheck; must stay independent of the Obsidian backend.
- **`src/lib/api-client.ts`** — `"use client"` fetch wrappers around `/api/*` for components to
  call. Keep this as the single place components go through to reach the backend.
- **`src/proxy.ts`** + **`src/lib/access-jwt.ts`** — optional Cloudflare Access gate for
  deployments exposed outside the LAN (Next.js 16 renamed the `middleware.ts` convention to
  `proxy.ts`; a `proxy` function, not `middleware`, is the required export). Only active when
  both `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` are set — otherwise it's a no-op, so LAN-only
  deploys and `npm run dev:mock` need no auth setup. When active, every request except
  `/api/health` must carry a `Cf-Access-Jwt-Assertion` header that verifies against Cloudflare's
  JWKS (`https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`, cached at module scope in
  `access-jwt.ts`); anything else gets a 403. This app has no auth of its own, so this is the only
  thing gating full vault read/write access when reachable from the internet. If only one of the
  two env vars is set (e.g. a typo), the proxy fails closed with a 500 rather than silently
  disabling auth — see `isAccessAuthMisconfigured()`.
- **`src/app/(shell)/`** — the app shell. `layout.tsx` renders `Sidebar` + `StatusBanner` and
  toggles single-pane vs. two-pane layout based on whether the current route is under `/edit/`
  (mobile-first: sidebar OR editor pane visible on narrow viewports, both on desktop). The route
  group `(shell)` doesn't affect URLs.
  - `edit/[...path]/page.tsx` — the catch-all editor route; `?new=true` skips the initial fetch
    for a brand-new file. Next.js decodes catch-all segments automatically, so
    `vault-route.ts#editHref` percent-encodes when building the link and it round-trips correctly.
- **`src/components/`** — `Sidebar` composes `SearchBox` + `FileTree` + `NewFileButton`;
  `FileTree`/`FileTreeNode` lazily expand directories via `fetchTree`; `Editor`/`EditorToolbar`
  wrap CodeMirror (`@uiw/react-codemirror`, markdown mode) for whole-file editing.

## Conventions

- Import via the `@/*` path alias (maps to `src/*`), configured identically in `tsconfig.json` and
  `vitest.config.mts`.
- Error handling in Route Handlers goes through `ApiError` (our own validation errors) /
  `ObsidianConfigError` / `ObsidianApiError`, all funneled through `apiErrorResponse`
  (`src/lib/api-error.ts:15-30`) for a consistent `{ error }` JSON shape and status code.
- Comments in this codebase explain *why*, not *what* — e.g. noting an upstream API quirk or a
  deliberate scope limitation. Match that style rather than narrating obvious code.
- `react-hooks/set-state-in-effect` is deliberately disabled (`eslint.config.mjs:13`): the MVP
  uses plain `useState` + `fetch` in `useEffect` (no React Query/Suspense) by design — don't
  "fix" this pattern.
- Tests live under `tests/`, mirroring `src/` (`tests/lib`, `tests/components`), and are excluded
  from `tsconfig.json`'s main program and from `eslint`. `tests/setup.ts` mocks the `server-only`
  package globally, since Vitest/jsdom never sets Next's `react-server` resolve condition that the
  real package depends on. Mock `undici` (not global `fetch`) when testing code that goes through
  `obsidian/client.ts` (see `tests/lib/obsidian-client.test.ts`).

## Pull requests

Before opening a PR, run `/code-review` against the diff — also enforced by a `PreToolUse` hook in
`.claude/settings.json` that blocks PR-creation tools until it's been run in the session.

If the diff touches `src/components/**` or `src/app/**` (i.e. changes rendered UI), include
before/after screenshots in the PR description:

1. Run `npm run dev:mock` and drive the affected view with Playwright (chromium is pre-installed at
   `/opt/pw-browsers/chromium`; see the `run` skill). Capture "before" against the base branch
   (e.g. a second checkout/worktree of the pre-change code) and "after" against the current branch.
2. Commit the PNGs to the PR branch under `.github/pr-screenshots/<branch-name>/{before,after}.png`
   — the GitHub API has no endpoint for uploading images directly into a PR body, so committing
   them and linking via `raw.githubusercontent.com` is the reliable path.
3. Embed them in the PR body, e.g.:
   ```markdown
   | Before | After |
   |---|---|
   | ![before](https://raw.githubusercontent.com/eh6gac4/corvexio/<branch-name>/.github/pr-screenshots/<branch-name>/before.png) | ![after](https://raw.githubusercontent.com/eh6gac4/corvexio/<branch-name>/.github/pr-screenshots/<branch-name>/after.png) |
   ```

This is documented workflow guidance, not hook-enforced — screenshotting requires driving a real
browser, which isn't reliable to gate mechanically.
