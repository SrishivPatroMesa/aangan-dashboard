import { db, when } from "../../../lib/db";
export const dynamic = "force-dynamic";

export default async function Lead({ params, searchParams }) {
  const sb = db();
  const [{ data: c }, { data: events }, { data: quals }] = await Promise.all([
    sb.from("call_records").select("*").eq("id", params.id).maybeSingle(),
    sb.from("integration_events").select("created_at,system,action,status,detail,attempt").eq("call_record_id", params.id).order("created_at"),
    sb.from("qualifications").select("created_at,tier,disposition,reasons,rules_version").eq("call_record_id", params.id).order("created_at"),
  ]);
  if (!c) return <p>Lead not found.</p>;
  const f = c.extraction ?? {};
  const stuck = ["needs_attention", "waiting_credentials"].includes(c.status);
  return (
    <>
      <p><a href="/leads">← Leads</a></p>
      <h1>{c.caller_name || c.caller_phone || c.vaani_call_id} {c.tier && <span className={`chip ${c.tier}`}>{c.tier}</span>}</h1>
      <p className="muted">{when(c.started_at ?? c.created_at)} · {c.caller_phone ?? "number withheld"} · {c.after_hours ? "after hours" : "studio hours"} · status {c.status}{c.waiting_on ? ` (waiting on ${c.waiting_on})` : ""}</p>
      {searchParams?.retried && <p className="badge">Retry requested: {searchParams.retried}</p>}
      {stuck && <form action="/api/retry" method="post"><input type="hidden" name="id" value={c.id} /><button>Retry now</button></form>}
      <div className="grid2" style={{ marginTop: 16 }}>
        <div><h2>Handoff note</h2><pre>{c.handoff_note ?? "Not written yet."}</pre></div>
        <div><h2>Captured</h2><div className="card"><table><tbody>
          {[["Location", f.location], ["Project", f.property_type], ["Carpet area", f.carpet_sqft && `${f.carpet_sqft} sq ft`], ["Scope", f.scope_summary], ["Timeline", f.deadline_text], ["Decision-maker", f.decision_maker], ["Budget stated", f.budget_text], ["Source", f.referral_source], ["Email", c.email], ["Missing", (f.missing_information ?? []).join(", ")]].map(([k, v]) => <tr key={k}><th>{k}</th><td>{v || "—"}</td></tr>)}
          <tr><th>HubSpot</th><td>{c.hubspot_deal_id ? `Deal ${c.hubspot_deal_id}` : c.hubspot_ticket_id ? `Ticket ${c.hubspot_ticket_id}` : "Not synced yet"}</td></tr>
          <tr><th>Booking</th><td>{c.booking_status ?? "—"}</td></tr>
        </tbody></table></div></div>
      </div>
      <h2>Why this tier</h2>
      <div className="card"><table><thead><tr><th>When</th><th>Tier</th><th>Disposition</th><th>Reasons</th><th>Rules version</th></tr></thead><tbody>
        {(quals ?? []).map((q, i) => <tr key={i}><td>{when(q.created_at)}</td><td>{q.tier}</td><td>{q.disposition}</td><td>{(q.reasons ?? []).join("; ")}</td><td>{q.rules_version}</td></tr>)}
      </tbody></table></div>
      <h2>Transcript</h2><pre>{c.transcript ?? "No transcript."}</pre>
      <h2>Audit trail</h2>
      <div className="card"><table><thead><tr><th>When</th><th>System</th><th>Action</th><th>Status</th><th>Detail</th></tr></thead><tbody>
        {(events ?? []).map((e, i) => <tr key={i}><td>{when(e.created_at)}</td><td>{e.system}</td><td>{e.action}</td><td>{e.status}</td><td className="muted">{(e.detail ?? "").slice(0, 160)}</td></tr>)}
      </tbody></table></div>
    </>
  );
}
