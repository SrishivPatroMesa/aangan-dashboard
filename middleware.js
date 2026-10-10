import { NextResponse } from "next/server";
// Basic auth for the whole app. Credentials come from Vercel environment variables.
export function middleware(req) {
  const user = process.env.DASHBOARD_USER || "owner";
  const pass = process.env.DASHBOARD_PASSWORD;
  if (!pass) return new NextResponse("Set DASHBOARD_PASSWORD in Vercel environment variables.", { status: 503 });
  const h = req.headers.get("authorization") || "";
  if (h.startsWith("Basic ")) {
    const [u, p] = atob(h.slice(6)).split(":");
    if (u === user && p === pass) return NextResponse.next();
  }
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Aangan"' } });
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
