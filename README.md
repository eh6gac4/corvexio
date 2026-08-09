# corvexio

A mobile-friendly web frontend for editing an [Obsidian](https://obsidian.md) vault over its
[Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) plugin. Built with
Next.js (App Router); all calls to the Obsidian API are proxied through server-side Route Handlers
so the API key never reaches the browser.

## Features

- Browse the vault as a lazily-expanding file tree
- Full-text fuzzy search (`/search/simple/`)
- Edit markdown in a CodeMirror editor, save (whole-file), delete, create new files
- Mobile-first layout (single-pane on narrow viewports, two-pane on desktop)
- Connectivity banner if the Obsidian backend is unreachable

## Local development

No real Obsidian instance is required for development — a mock Local REST API server (backed by
`fixtures/vault/`) is included:

```bash
npm install
npm run dev:mock   # mock server (https://127.0.0.1:27124) + `next dev` together
```

Then open http://localhost:3000. `.env.development` (committed, non-secret) already points the
dev server at the mock backend.

To run against a real vault instead, copy `.env.local.example` to `.env.local` and fill in your
Obsidian Local REST API URL and API key (Obsidian → Settings → Local REST API with MCP), then:

```bash
npm run dev
```

## Testing

```bash
npm test    # vitest: unit tests for the Obsidian proxy client + path encoding,
            # component tests for Editor/FileTree/SearchBox
npm run build   # type-checks and builds the production bundle
npm run lint
```

## Deployment

Builds to a standalone Docker image:

```bash
docker build -t corvexio .
```

Deployed as a Portainer "Git repository" stack pointing at this repo's `docker-compose.yml`, with
`OBSIDIAN_API_URL` / `OBSIDIAN_API_KEY` / `OBSIDIAN_TLS_INSECURE` set as stack environment
variables in the Portainer UI (there's no `.env.production` file on disk in that setup, since
Portainer clones the repo fresh on each deploy). For a local `docker compose up` instead, put the
same three vars in a gitignored `.env` file (copy `.env.local.example` as a starting point). The
container's `/api/health` endpoint never depends on the Obsidian backend being reachable, so a
temporarily unreachable vault/VPN won't crash-loop the container.

## Architecture notes

- `src/lib/obsidian/client.ts` — the only module that reads `OBSIDIAN_API_KEY`. Marked
  `import "server-only"` so it's a build error to import it from client code. Uses a dedicated
  `undici` `Agent` (not global `fetch`) so TLS verification (`OBSIDIAN_TLS_INSECURE`, for the
  Local REST API's self-signed cert) is scoped to this one upstream connection.
- `src/app/api/*` — thin Route Handlers that proxy to the Obsidian API and translate errors.
- MVP scope: full-text search only (no tag/backlink browsing), whole-file save via `PUT` (no
  autosave, no `PATCH`-based partial edits in the UI — though `PATCH` is plumbed through
  `/api/file` for future use).
