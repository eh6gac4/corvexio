import { NextResponse, type NextRequest } from "next/server";
import { isAccessAuthEnabled, verifyAccessJwt } from "@/lib/access-jwt";

export async function proxy(request: NextRequest) {
  if (!isAccessAuthEnabled()) {
    return NextResponse.next();
  }
  try {
    await verifyAccessJwt(request.headers.get("Cf-Access-Jwt-Assertion"));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  // /api/health is excluded: the container healthcheck hits it from inside the
  // container (127.0.0.1), which never carries a Cf-Access-Jwt-Assertion header.
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
