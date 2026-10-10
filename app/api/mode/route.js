import { NextResponse } from "next/server";
// Switches between live data and the labelled demo dataset (for presentations).
export async function GET(req) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("m") === "demo" ? "demo" : "live";
  const back = url.searchParams.get("back") || "/";
  const res = NextResponse.redirect(new URL(back.startsWith("/") ? back : "/", req.url), 303);
  res.cookies.set("aangan_mode", mode, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
