import { db, inr, pct, hubspotPipeline } from "../lib/db";
export const dynamic = "force-dynamic";

export default async function Overview({ searchParams }) {
  const days = Math.min(Math.max(Number(searchParams?.days ?? 30), 1), 365);
  const since = new Date(Date.now() - days * 86400e3).toISOString();
  const sb = db();
  const [{ data: calls, error }, { data: costs }, { data: load }, { data: recovery }, { data: cfg }, { data: rules }] = await Promise.all([
    sb.from("call_records").select("id,source,tier,disposition,status,after_hours,booking_status,hubspot_contact_id,pricing_asked,duration_sec,designer_id,created_at").gte("created_at", since),
    sb.from("usage_costs").select("vendor,source,amount_inr,units,unit").gte("created_at", since),
    sb.from("designer_load").select("*"),
    sb.from("recovery_queue").select("*").order("created_at", { ascending: false }).limit(50),
    sb.from("app_config").select("key,value").eq("key", "hubspot_pipeline"),
    sb.from("studio_rules").select("key,value").in("key", ["fixed_costs_monthly", "gross_margin_pct", "front_desk_minutes_per_call"]),
  ]);
  if (error) return <p>Could not load data: {error.message}</p>;
  const live = (calls ?? []).filter((c) => c.source === "vaani");
  const all = calls ?? [];
  const shown = live.length ? live : all;
  const n = shown.length, by = (t) => shown.filter((c) => c.tier === t).length;
  const R = Object.fromEntries((rules ?? []).map((r) => [r.key, r.value]));
  const pipeline = cfg?.[0]?.value ? JSON.parse(cfg[0].value) : null;
  const hs = await hubspotPipeline(pipeline);

  const vendors = {};
  for (const c of costs ?? []) {
    const v = (vendors[c.vendor] ??= { actual: 0, estimated: 0, unavailable: 0, records: 0 });
    v.records++; if (c.amount_inr == null) v.unavailable++; else v[c.source === "actual" ? "actual" : "estimated"] += Number(c.amount_inr);
  }
  const fixed = (R.fixed_costs_monthly ?? []).reduce((a, f) => a + Number(f.inr || 0), 0) * (days / 30);
  const variable = Object.values(vendors).reduce((a, v) => a + v.actual + v.estimated, 0);
  const anyUnavailable = Object.values(vendors).some((v) => v.unavailable > 0);
  const total = variable + fixed;
  const booked = shown.filter((c) => c.booking_status === "confirmed").length;
  const captured = shown.filter((c) => c.hubspot_contact_id).length;
  const margin = R.gross_margin_pct;
  const roi = hs && !hs.error && margin && total ? ((hs.wonAmount * margin - total) / total) : null;
  const savedHours = (n * Number(R.front_desk_minutes_per_call ?? 4.9)) / 60;

  return (
    <>
      <h1>Owner overview</h1>
      <p className="muted">Last {days} days · {live.length ? "live calls only" : "no live calls yet, showing test and replayed calls"} · <a href="?days=7">7d</a> · <a href="?days=30">30d</a> · <a href="?days=90">90d</a></p>

      <h2>Lead operations</h2>
      <div className="tiles">
        <Tile v={n} l="Calls handled" />
        <Tile v={pct(shown.filter((c) => c.after_hours).length, n)} l="Outside studio hours" />
        <Tile v={shown.filter((c) => c.disposition === "dropped_call").length} l="Dropped calls" />
        <Tile v={pct(captured, n)} l="Captured in HubSpot" />
        <Tile v={`${by("P1")} / ${by("P2")} / ${by("P3")}`} l="P1 / P2 / P3" />
        <Tile v={by("SERVICE")} l="Existing-client escalations" />
        <Tile v={shown.filter((c) => c.pricing_asked > 0).length} l="Calls that asked about price" />
        <Tile v={(recovery ?? []).length} l="In recovery queue" warn={(recovery ?? []).length > 0} />
      </div>

      <h2>Conversion</h2>
      <div className="tiles">
        <Tile v={booked} l="Consultations booked by the agent" />
        <Tile v={pct(booked, by("P1"))} l="P1 booking rate" />
        {hs && !hs.error ? (<>
          <Tile v={hs.byStage.consultation_held ?? 0} l="Consultations held" />
          <Tile v={hs.wonCount} l="Won" /><Tile v={hs.lostCount} l="Lost" />
          <Tile v={inr(hs.wonAmount)} l="Revenue won (deal amounts)" />
          <Tile v={hs.wonCount ? inr(hs.wonAmount / hs.wonCount) : "—"} l="Average project value" />
        </>) : <Tile v="Unavailable" l={hs?.error ? `HubSpot: ${hs.error}` : "Set HUBSPOT_TOKEN in Vercel"} />}
      </div>

      <h2>Cost and ROI</h2>
      <div className="card"><table><thead><tr><th>Line</th><th>Actual</th><th>Estimated</th><th>Records without a cost</th></tr></thead><tbody>
        {Object.entries(vendors).map(([k, v]) => <tr key={k}><td>{k}</td><td>{inr(v.actual)}</td><td>{inr(v.estimated)}</td><td>{v.unavailable} of {v.records}</td></tr>)}
        <tr><td>Fixed costs (pro-rated from studio_rules.fixed_costs_monthly)</td><td colSpan={3}>{fixed ? inr(fixed) : "None entered"}</td></tr>
        <tr><td><b>Total operating cost</b></td><td colSpan={3}><b>{inr(total)}</b>{anyUnavailable ? " (incomplete: some costs not reported)" : ""}</td></tr>
        <tr><td>Cost per call handled</td><td colSpan={3}>{n ? inr(total / n) : "—"}</td></tr>
        <tr><td>Cost per consultation booked</td><td colSpan={3}>{booked ? inr(total / booked) : "—"}</td></tr>
        <tr><td>Front-desk time saved (estimate: calls × {R.front_desk_minutes_per_call ?? 4.9} min)</td><td colSpan={3}>{savedHours.toFixed(1)} hours</td></tr>
        <tr><td>ROI = (won revenue × gross margin − total cost) ÷ total cost</td><td colSpan={3}>{roi == null ? "Unavailable (needs HubSpot revenue and studio_rules.gross_margin_pct)" : `${Math.round(roi * 100)}%`}</td></tr>
      </tbody></table></div>

      <h2>Team</h2>
      <div className="card"><table><thead><tr><th>Designer</th><th>Assigned</th><th>P1</th><th>P2</th><th>Booked</th></tr></thead><tbody>
        {(load ?? []).length ? load.map((d) => <tr key={d.id}><td>{d.name}</td><td>{d.assigned}</td><td>{d.p1}</td><td>{d.p2}</td><td>{d.booked}</td></tr>)
          : <tr><td colSpan={5} className="muted">No designers configured yet (POST /admin/designers).</td></tr>}
      </tbody></table></div>

      <h2>Recovery queue</h2>
      <div className="card"><table><thead><tr><th>Call</th><th>When</th><th>Tier</th><th>Status</th><th>Waiting on / error</th></tr></thead><tbody>
        {(recovery ?? []).length ? recovery.map((r) => <tr key={r.id}><td><a href={`/leads/${r.id}`}>{r.vaani_call_id}</a></td><td>{new Date(r.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td><td>{r.tier ?? "—"}</td><td><span className="badge warn">{r.status}</span></td><td>{r.waiting_on ?? r.last_error ?? "—"}</td></tr>)
          : <tr><td colSpan={5} className="muted">Nothing stuck.</td></tr>}
      </tbody></table></div>
    </>
  );
}
function Tile({ v, l, warn }) { return <div className={`tile${warn ? " warn" : ""}`}><div className="v">{v}</div><div className="l">{l}</div></div>; }
