/**
 * Vault paths are nested and can contain spaces/unicode; each segment must be
 * percent-encoded individually and rejoined, not encoded as a single string
 * (which would also escape the "/" separators).
 */
export function encodeVaultPath(path: string): string {
  return path
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/** True if a raw listing entry (as returned by the Local REST API) is a directory. */
export function isDirectoryEntry(entry: string): boolean {
  return entry.endsWith("/");
}

export function stripTrailingSlash(entry: string): string {
  return entry.endsWith("/") ? entry.slice(0, -1) : entry;
}

export function joinVaultPath(parent: string, child: string): string {
  return parent ? `${parent}/${child}` : child;
}
