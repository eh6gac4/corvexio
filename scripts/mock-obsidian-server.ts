/**
 * Standalone HTTPS mock of the Obsidian Local REST API, backed by fixtures/vault/*.md.
 * Lets the whole app (including the TLS-agent code path in src/lib/obsidian/client.ts)
 * be exercised end-to-end without a real Obsidian instance. Run via `npm run dev:mock`.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:https";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import selfsigned from "selfsigned";

const PORT = Number(process.env.MOCK_OBSIDIAN_PORT ?? 27124);
const API_KEY = process.env.OBSIDIAN_API_KEY ?? "dev-mock-api-key";
const VAULT_ROOT = join(process.cwd(), "fixtures/vault");

interface SearchMatch {
  context: string;
  match: { start: number; end: number };
}

interface SearchResult {
  filename: string;
  score: number;
  matches: SearchMatch[];
}

async function generateCert() {
  // selfsigned's generate() is async (returns a Promise) as of v5 — awaiting is required,
  // otherwise https.createServer silently gets Promise objects instead of PEM strings.
  const pems = await selfsigned.generate([{ name: "commonName", value: "localhost" }], {
    days: 3650,
    keySize: 2048,
    algorithm: "sha256",
  });
  return { key: pems.private, cert: pems.cert };
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function listDir(relPath: string): string[] {
  const abs = join(VAULT_ROOT, relPath);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).map((name) => {
    const isDir = statSync(join(abs, name)).isDirectory();
    return isDir ? `${name}/` : name;
  });
}

function walkMarkdownFiles(relPath: string): string[] {
  const abs = join(VAULT_ROOT, relPath);
  const results: string[] = [];
  for (const name of readdirSync(abs)) {
    const entryRel = relPath ? `${relPath}/${name}` : name;
    const entryAbs = join(abs, name);
    if (statSync(entryAbs).isDirectory()) {
      results.push(...walkMarkdownFiles(entryRel));
    } else if (name.endsWith(".md")) {
      results.push(entryRel);
    }
  }
  return results;
}

function searchVault(query: string): SearchResult[] {
  const needle = query.toLowerCase();
  if (!needle) return [];
  const results: SearchResult[] = [];
  for (const entryRel of walkMarkdownFiles("")) {
    const content = readFileSync(join(VAULT_ROOT, entryRel), "utf-8");
    const idx = content.toLowerCase().indexOf(needle);
    if (idx < 0) continue;
    const start = Math.max(0, idx - 20);
    const end = Math.min(content.length, idx + needle.length + 20);
    results.push({
      filename: entryRel,
      score: 1,
      matches: [
        {
          context: content.slice(start, end),
          match: { start: idx - start, end: idx - start + needle.length },
        },
      ],
    });
  }
  return results;
}

async function handleVault(
  req: IncomingMessage,
  res: ServerResponse,
  vaultPath: string,
): Promise<void> {
  const isDirRequest = vaultPath === "" || vaultPath.endsWith("/");
  const abs = join(VAULT_ROOT, vaultPath);

  if (req.method === "GET" && isDirRequest) {
    sendJson(res, 200, { files: listDir(vaultPath.replace(/\/$/, "")) });
    return;
  }

  if (req.method === "GET") {
    if (!existsSync(abs)) return sendJson(res, 404, { errorCode: 40400, message: "Not found" });
    res.writeHead(200, { "Content-Type": "text/markdown" });
    res.end(readFileSync(abs, "utf-8"));
    return;
  }

  if (req.method === "PUT") {
    const body = await readBody(req);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, body, "utf-8");
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "DELETE") {
    if (existsSync(abs)) unlinkSync(abs);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "PATCH") {
    // Minimal support: appends the raw body. The MVP UI never calls PATCH; this
    // just keeps the mock from 405-ing if the plumbed-but-unused route is exercised.
    const body = await readBody(req);
    const existing = existsSync(abs) ? readFileSync(abs, "utf-8") : "";
    const updated = existing + body;
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, updated, "utf-8");
    res.writeHead(200, { "Content-Type": "text/markdown" });
    res.end(updated);
    return;
  }

  sendJson(res, 405, { errorCode: 40500, message: "Method not allowed" });
}

async function main() {
  const cert = await generateCert();

  const server = createServer(cert, (req, res) => {
    void (async () => {
      const url = new URL(req.url ?? "/", `https://localhost:${PORT}`);

      if (url.pathname === "/") {
        sendJson(res, 200, { status: "OK", versions: { obsidian: "mock", self: "mock" } });
        return;
      }

      const authHeader = req.headers["authorization"];
      if (authHeader !== `Bearer ${API_KEY}`) {
        sendJson(res, 401, { errorCode: 40101, message: "Unauthorized" });
        return;
      }

      try {
        if (url.pathname === "/search/simple/" && req.method === "POST") {
          sendJson(res, 200, searchVault(url.searchParams.get("query") ?? ""));
          return;
        }

        if (url.pathname.startsWith("/vault/")) {
          const vaultPath = decodeURIComponent(url.pathname.slice("/vault/".length));
          await handleVault(req, res, vaultPath);
          return;
        }

        sendJson(res, 404, { errorCode: 40400, message: "Not found" });
      } catch (err) {
        sendJson(res, 500, { errorCode: 50000, message: (err as Error).message });
      }
    })();
  });

  server.listen(PORT, () => {
    console.log(`[mock-obsidian] listening on https://127.0.0.1:${PORT} (self-signed cert)`);
  });
}

main().catch((err) => {
  console.error("[mock-obsidian] failed to start:", err);
  process.exit(1);
});
