import { loadCore } from "../../../lib/data";
import { STAGES } from "../../../lib/format";
export const dynamic = "force-dynamic";
const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
export async function GET(req) {
  const url = new URL(req.url), view = url.searchParams.get("view") ?? "all", q = (url.searchParams.get("q") ?? "").toLowerCase();
  const d = await loadCore({ days: 3650, includeTest: true });
  const f = { open: (c) => c.needsCall, P1: (c) => c.tier === "P1", P2: (c) => c.tier === "P2", P3: (c) => c.tier === "P3", SERVICE: (c) => c.tier === "SERVICE" }[view] ?? (() => true);
  const rows = d.calls.filter(f).filter((c) => !q || [c.caller_name, c.caller_phone, c.extraction?.location].some((s) => s && String(s).toLowerCase().includes(q)));
  const head = ["Name", "Phone", "Area", "Property", "Tier", "Stage", "Owner", "Called", "Summary"];
  const lines = rows.map((c) => [c.caller_name, c.caller_phone, c.extraction?.location, c.extraction?.property_type, c.tier, STAGES[c.stage] ?? "", c.designer?.name ?? "Studio owner", c.when, c.summary].map(esc).join(","));
  return new Response([head.join(","), ...lines].join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="aangan-leads-${view}.csv"` } });
}
