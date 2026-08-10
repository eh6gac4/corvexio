/**
 * Builds an /edit/... href from a raw vault path. Next.js (16.2) does NOT
 * decode catch-all route segments, so the [...path] page's params.path
 * elements arrive still percent-encoded and must be decodeURIComponent'd
 * before use.
 */
export function editHref(path: string): string {
  return `/edit/${path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}
