/**
 * Builds an /edit/... href from a raw vault path, and decodes it back on the
 * other end. Next.js (16.2) does NOT decode catch-all route segments, so the
 * [...path] page's params.path elements arrive still percent-encoded as
 * produced here — decodeEditPath() is the matching counterpart.
 */
export function editHref(path: string): string {
  return `/edit/${path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

/**
 * Decodes one route-segment string back to its raw form, falling back to
 * the raw segment on an invalid escape (segments from outside this app's own
 * hrefs — hand-typed or externally shared URLs — may contain invalid ones)
 * rather than letting decodeURIComponent throw.
 */
export function decodeVaultSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Decodes a [...path] route's params.path segments back into a raw vault
 * path.
 */
export function decodeEditPath(segments: string[]): string {
  return segments.map(decodeVaultSegment).join("/");
}
