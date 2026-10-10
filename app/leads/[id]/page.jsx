import { Fragment } from "react";
import { loadLead } from "../../../lib/data";
import { STAGES, DISPOSITIONS, relative, fmtDateTime, minutes, titleCase } from "../../../lib/format";
import { Tier, Status, Problem } from "../../../components/ui";
export const dynamic = "force-dynamic";

const EVENT_TEXT = {
  "vaani:webhook": "Call received from the phone agent", "pipeline:extract": "Details read from the call", "gemini:extract": "Gemini read the transcript",
  "pipeline:classify": "Tiered by studio rules", "hubspot:contact_upsert": "Contact saved in HubSpot", "hubspot:deal_create": "Deal created in HubSpot",
  "hubspot:ticket_create": "Escalation filed", "hubspot:note_create": "Handoff note added in HubSpot", "hubspot:task_create": "Call task assigned in HubSpot",
  "hubspot:booking_link": "Booking added to the deal", "pipeline:done": "Finished", "pipeline:wait": "Waiting for a connection", "pipeline:error": "Step failed, will retry",
};

export default async function Lead({ params, searchParams }) {
  let d;
  try { d = await loadLead(params.id); } catch (e) { return <Problem error={e} />; }
  const c = d.call;
  if (!c) return <><p><a href="/leads">Back to leads</a></p><h1>Lead not found</h1></>;
  const x = c.extraction ?? {};
  const r = c.needsCall ? relative(c.due) : null;
  const hsUrl = d.portalId && c.hubspot_deal_id ? `https://app.hubspot.com/contacts/${d.portalId}/record/0-3/${c.hubspot_deal_id}` : d.portalId && c.hubspot_contact_id ? `https://app.hubspot.com/contacts/${d.portalId}/record/0-1/${c.hubspot_contact_id}` : null;
  const facts = [
    ["Phone", c.caller_phone], ["Email", c.email], ["Area", x.location], ["Property", x.property_type], ["Carpet area", x.carpet_sqft ? `${Number(x.carpet_sqft).toLocaleString("en-IN")} sq ft` : null],
    ["Scope", x.scope_summary], ["Current state", x.current_state], ["Timeline", x.deadline_text], ["Decides", x.decision_maker], ["Budget said", x.budget_text], ["Found us via", x.referral_source],
  ];
  return (
    <>
      <p className="small"><a href="/leads">Back to leads</a></p>
      <div className="record-head">
        <div>
          <h1>{c.caller_name || c.caller_phone || "Unknown caller"}</h1>
          <div className="meta"><Tier tier={c.tier} /><span className="pill">{c.stage ? STAGES[c.stage] : DISPOSITIONS[c.disposition] ?? "Processing"}</span>{(c.stuck || c.booking_status === "confirmed") && <Status call={c} />}<span className="small muted">Called {fmtDateTime(c.started_at ?? c.created_at)}{c.after_hours ? ", after hours" : ""}</span></div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {c.caller_phone && <a className="btn" href={`tel:${c.caller_phone}`}>Call {c.caller_name?.split(" ")[0] ?? "back"}</a>}
          {hsUrl && <a className="btn primary" href={hsUrl} target="_blank" rel="noreferrer">Open in HubSpot</a>}
        </div>
      </div>
      {searchParams?.retried && <div className="banner">Retry requested. Result: {searchParams.retried}.</div>}
      {c.stuck && (
        <div className="banner">This lead hasn't reached HubSpot yet: {c.waiting_on ? `waiting for ${titleCase(c.waiting_on)}` : c.last_error}.
          <form action="/api/retry" method="post" style={{ display: "inline", marginLeft: 10 }}><input type="hidden" name="id" value={c.id} /><button className="btn">Retry now</button></form>
        </div>
      )}
      <div className="record">
        <div className="stack">
          <section className="panel"><div className="panel-head"><h2>Handoff note</h2></div><div className="panel-body"><p className="note">{c.handoff_note ?? c.summary ?? "Not written yet."}</p></div></section>
          <section className="panel"><div className="panel-head"><h2>Why {c.tier ?? "this tier"}</h2><span className="small muted">{DISPOSITIONS[c.disposition] ?? ""}</span></div>
            <div className="panel-body"><ul className="reasons">{c.reasons.map((s, i) => <li key={i}>{s}</li>)}</ul>
              {(x.missing_information ?? []).length > 0 && <><h3 style={{ marginTop: 14 }}>Ask on the callback</h3><div className="chips" style={{ marginTop: 6 }}>{x.missing_information.map((m) => <span className="pill" key={m}>{m}</span>)}</div></>}
            </div></section>
          <section className="panel"><div className="panel-body" style={{ paddingTop: 16 }}>
            <details className="transcript"><summary>Read the call transcript</summary><pre>{d.transcript ?? "No transcript for this call."}</pre></details>
          </div></section>
          <section className="panel"><div className="panel-head"><h2>Activity</h2></div><div className="panel-body">
            {d.events.length ? <ul className="timeline">{d.events.map((e, i) => (
              <li key={i}><span className={`dot ${e.status}`} aria-hidden="true" /><span>{EVENT_TEXT[`${e.system}:${e.action}`] ?? `${titleCase(e.system)}: ${titleCase(e.action)}`}{e.status !== "ok" ? <span className="muted"> ({titleCase(e.status)})</span> : null}</span><span className="small faint">{fmtDateTime(e.created_at)}</span></li>
            ))}</ul> : <p className="muted">No activity recorded.</p>}
          </div></section>
        </div>
        <aside className="stack">
          <section className="panel"><div className="panel-head"><h2>Next call</h2></div><div className="panel-body">
            {r ? <p style={{ margin: 0, fontWeight: 600, color: r.overdue ? "var(--bad)" : undefined }}>{r.text}</p> : <p className="muted" style={{ margin: 0 }}>Nothing due.</p>}
            <p className="small muted" style={{ margin: "6px 0 0" }}>{c.designer ? `Assigned to ${c.designer.name}.` : "Assigned to the studio owner."} {c.dueSource === "sla" && r ? "Due time follows the tier's response target." : ""}</p>
            {c.booking_status === "confirmed" && <p className="pill ok" style={{ marginTop: 10 }}>Consultation booked</p>}
          </div></section>
          <section className="panel"><div className="panel-head"><h2>Details</h2></div><div className="panel-body">
            <dl className="facts">{facts.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v || <span className="faint">Not said</span>}</dd></Fragment>)}</dl>
          </div></section>
          <section className="panel"><div className="panel-head"><h2>Call</h2></div><div className="panel-body">
            <dl className="facts"><dt>Length</dt><dd>{minutes(c.duration_sec)}</dd><dt>Asked price</dt><dd>{c.pricing_asked ? `${c.pricing_asked} time${c.pricing_asked > 1 ? "s" : ""}` : "No"}</dd><dt>Recording</dt><dd>{c.recording_url ? <a href={c.recording_url} target="_blank" rel="noreferrer">Listen</a> : <span className="faint">None</span>}</dd><dt>Call ID</dt><dd className="small">{c.vaani_call_id}</dd></dl>
          </div></section>
        </aside>
      </div>
    </>
  );
}
