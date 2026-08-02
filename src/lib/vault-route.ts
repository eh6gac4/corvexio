/**
 * Builds an /edit/... href from a raw vault path. Next.js decodes catch-all
 * route segments automatically, so encoding here round-trips back to the
 * original path in the [...path] page's params.
 */
export function editHref(path: string): string {
  return `/edit/${path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}
