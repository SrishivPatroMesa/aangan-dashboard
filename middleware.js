import { NextResponse } from "next/server";
// Public by default so examiners can open the link. Set REQUIRE_LOGIN=1 in Vercel to require DASHBOARD_USER / DASHBOARD_PASSWORD again.
export function middleware(req) {
  const locked = process.env.REQUIRE_LOGIN === "1";
  const path = new URL(req.url).pathname;
  if (!locked) {
    if (path.startsWith("/api/retry") || path.startsWith("/api/export")) return new NextResponse("Disabled on the public view.", { status: 403 });
    return NextResponse.next();
  }
  const user = process.env.DASHBOARD_USER || "owner", pass = process.env.DASHBOARD_PASSWORD;
  if (!pass) return new NextResponse("Set DASHBOARD_PASSWORD in Vercel environment variables.", { status: 503 });
  const h = req.headers.get("authorization") || "";
  if (h.startsWith("Basic ")) { const [u, p] = atob(h.slice(6)).split(":"); if (u === user && p === pass) return NextResponse.next(); }
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Aangan"' } });
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
