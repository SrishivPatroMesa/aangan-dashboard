import { NextResponse } from "next/server";
// Asks the lead engine to re-run a stuck call. The engine secret stays on the server.
export async function POST(req) {
  const form = await req.formData();
  const id = String(form.get("id") || "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse("Invalid lead id", { status: 400 });
  const r = await fetch(`${process.env.SUPABASE_URL}/functions/v1/lead-engine/admin/retry`, {
    method: "POST", cache: "no-store",
    headers: { "Content-Type": "application/json", "x-webhook-secret": process.env.LEAD_ENGINE_SECRET || "" },
    body: JSON.stringify({ call_record_id: id }),
  });
  const b = await r.json().catch(() => ({}));
  return NextResponse.redirect(new URL(`/leads/${id}?retried=${encodeURIComponent(b.outcome ?? `error ${r.status}`)}`, req.url), 303);
}
