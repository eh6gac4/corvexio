import { NextResponse, type NextRequest } from "next/server";
import { isAccessAuthEnabled, isAccessAuthMisconfigured, verifyAccessJwt } from "@/lib/access-jwt";

export async function proxy(request: NextRequest) {
  if (isAccessAuthMisconfigured()) {
    console.error(
      "[access-jwt] CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUD must both be set (or both unset) — failing closed",
    );
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (!isAccessAuthEnabled()) {
    return NextResponse.next();
  }
  try {
    await verifyAccessJwt(request.headers.get("Cf-Access-Jwt-Assertion"));
  } catch (error) {
    console.error("[access-jwt] verification failed", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  // /api/health is excluded: the container healthcheck hits it from inside the
  // container (127.0.0.1), which never carries a Cf-Access-Jwt-Assertion header.
  // `api/health$` (not a bare prefix) so a future route like /api/healthy doesn't
  // also slip through unauthenticated.
  matcher: ["/((?!api/health$|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
