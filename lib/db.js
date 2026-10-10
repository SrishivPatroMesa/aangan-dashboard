import { createClient } from "@supabase/supabase-js";
// Server-only client. The service key never reaches the browser: only server components and routes import this.
export function db() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  return createClient(url, key, { auth: { persistSession: false } });
}
export const inr = (n) => (n == null ? "Unavailable" : "₹" + Math.round(n).toLocaleString("en-IN"));
export const pct = (a, b) => (b ? Math.round((a / b) * 100) + "%" : "—");
export const when = (iso) => iso ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso)) : "—";

// Conversion and revenue come from HubSpot (system of record). Returns null when not configured.
export async function hubspotPipeline(pipeline) {
  const token = process.env.HUBSPOT_TOKEN;
  if (!token || !pipeline) return null;
  const out = { byStage: {}, wonAmount: 0, wonCount: 0, lostCount: 0, total: 0 };
  let after;
  for (let page = 0; page < 20; page++) {
    const r = await fetch("https://api.hubapi.com/crm/v3/objects/deals/search", {
      method: "POST", cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: "pipeline", operator: "EQ", value: pipeline.id }] }], properties: ["dealstage", "amount", "hubspot_owner_id", "lost_reason_detail"], limit: 100, after }),
    });
    if (!r.ok) return { error: `HubSpot ${r.status}` };
    const b = await r.json();
    for (const d of b.results ?? []) {
      const key = Object.entries(pipeline.stages).find(([, id]) => id === d.properties.dealstage)?.[0] ?? "other";
      out.byStage[key] = (out.byStage[key] ?? 0) + 1; out.total++;
      if (key === "won") { out.wonCount++; out.wonAmount += Number(d.properties.amount || 0); }
      if (key === "lost") out.lostCount++;
    }
    after = b.paging?.next?.after; if (!after) break;
  }
  return out;
}
