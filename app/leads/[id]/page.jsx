import { Fragment } from "react";
import { loadLead, isPublic } from "../../../lib/data";
import { STAGES, DISPOSITIONS, relative, fmtDateTime, minutes, titleCase, inr } from "../../../lib/format";
import { Tier, Problem, Avatar, DemoNote } from "../../../components/ui";
import Icon from "../../../components/Icon";
export const dynamic = "force-dynamic";

const PATH = ["new_enquiry", "consultation_booked", "consultation_held", "proposal_sent", "won"];
const EVENT_TEXT = {
  "vaani:webhook": "Call received from the phone agent", "pipeline:extract": "Details read from the call", "gemini:extract": "Gemini read the transcript",
  "pipeline:classify": "Tiered by studio rules", "hubspot:contact_upsert": "Contact saved in HubSpot", "hubspot:deal_create": "Deal created in HubSpot",
  "hubspot:ticket_create": "Escalation filed", "hubspot:note_create": "Handoff note added in HubSpot", "hubspot:task_create": "Call task assigned in HubSpot",
  "hubspot:booking_link": "Booking added to the deal", "pipeline:done": "Finished processing", "pipeline:wait": "Waiting for a connection", "pipeline:error": "Step failed, retrying",
};

export default async function Lead({ params, searchParams }) {
  let d;
  try { d = await loadLead(params.id); } catch (e) { return <Problem error={e} />; }
  const c = d.call;
  if (!c) return <><p className="small"><a href="/leads">Leads</a></p><h1>Lead not found</h1></>;
  const tab = ["overview", "transcript", "activity"].includes(searchParams?.tab) ? searchParams.tab : "overview";
  const x = c.extraction ?? {};
  const r = c.needsCall ? relative(c.due) : null;
  const hsUrl = d.portalId && c.hubspot_deal_id ? `https://app.hubspot.com/contacts/${d.portalId}/record/0-3/${c.hubspot_deal_id}` : d.portalId && c.hubspot_contact_id ? `https://app.hubspot.com/contacts/${d.portalId}/record/0-1/${c.hubspot_contact_id}` : null;
  const stageIdx = c.stage === "lost" ? -2 : PATH.indexOf(c.stage === "needs_review" || c.stage === "follow_up" ? "new_enquiry" : c.stage);
  const facts = [["Phone", c.caller_phone], ["Email", c.email], ["Area", x.location], ["Property", x.property_type], ["Carpet area", x.carpet_sqft ? `${Number(x.carpet_sqft).toLocaleString("en-IN")} sq ft` : null], ["Scope", x.scope_summary], ["Current state", x.current_state], ["Timeline", x.deadline_text], ["Decides", x.decision_maker], ["Budget said", x.budget_text], ["Found us via", x.referral_source]];
  const base = `/leads/${c.id}`;
  return (
    <>
      <p className="small"><a href="/leads">Leads</a> <span className="faint">/</span> <span className="muted">{c.caller_name || "Lead"}</span></p>
      <DemoNote mode={d.mode} />
      <div className="rec-head">
        <div className="rec-id">
          <Avatar name={c.caller_name ?? "?"} size="lg" />
          <div>
            <h1>{c.caller_name || c.caller_phone || "Unknown caller"}</h1>
            <div className="meta"><Tier tier={c.tier} /><span className="pill">{DISPOSITIONS[c.disposition] ?? "Processing"}</span>{c.amount ? <span className="pill ok">{inr(c.amount)}</span> : null}<span className="small muted">{x.location ? <><Icon name="pin" size={13} style={{ verticalAlign: -2 }} /> {x.location}  ·  </> : null}Called {fmtDateTime(c.when)}{c.after_hours ? ", after hours" : ""}</span></div>
          </div>
        </div>
        <div className="actions">
          {c.caller_phone && (isPublic() ? <span className="btn" aria-disabled="true" title="Hidden on the public view"><Icon name="phone" size={15} />Call</span> : <a className="btn" href={`tel:${c.caller_phone}`}><Icon name="phone" size={15} />Call</a>)}
          {c.email ? <a className="btn" href={`mailto:${c.email}`}><Icon name="mail" size={15} />Email</a> : <span className="btn" aria-disabled="true" title="No email captured"><Icon name="mail" size={15} />Email</span>}
          <span className="btn" aria-disabled="true" title="Connect Calendly to book from here"><Icon name="book" size={15} />Book consultation</span>
          {hsUrl && <a className="btn primary" href={hsUrl} target="_blank" rel="noreferrer"><Icon name="external" size={15} />Open in HubSpot</a>}
        </div>
      </div>
      {c.tier !== "SERVICE" && c.tier !== "P3" && (
        <div className="path" aria-label="Pipeline stage">
          {PATH.map((s, i) => <span key={s} className={stageIdx === -2 && i === PATH.length - 1 ? "lost" : i < stageIdx ? "done" : i === stageIdx ? "now" : ""}>{stageIdx === -2 && i === PATH.length - 1 ? "Lost" : STAGES[s]}</span>)}
        </div>
      )}
      {searchParams?.retried && <div className="banner info">Retry requested. Result: {searchParams.retried}.</div>}
      {c.stuck && <div className="banner"><Icon name="warn" size={16} />This lead hasn't reached HubSpot yet: {c.waiting_on ? `waiting for ${titleCase(c.waiting_on)}` : c.last_error}.{!isPublic() && <form action="/api/retry" method="post" style={{ marginLeft: "auto" }}><input type="hidden" name="id" value={c.id} /><button className="btn">Retry now</button></form>}</div>}
      <nav className="tabs" aria-label="Lead sections">
        {[["overview", "Overview"], ["transcript", "Call transcript"], ["activity", "Activity"]].map(([k, l]) => <a key={k} href={`${base}?tab=${k}`} aria-current={tab === k ? "page" : undefined}>{l}</a>)}
      </nav>
      <div className="record">
        <div className="stack">
          {tab === "overview" && <>
            <section className="panel"><div className="panel-head"><h2>Handoff note</h2><span className="sub">Written from the call for the designer</span></div><div className="panel-body"><p className="note">{c.handoff_note ?? c.summary ?? "Not written yet."}</p></div></section>
            <section className="panel"><div className="panel-head"><h2>Why {c.tier ?? "this tier"}</h2><span className="sub">{DISPOSITIONS[c.disposition] ?? ""}</span></div>
              <div className="panel-body"><ul className="reasons">{c.reasons.map((s, i) => <li key={i}>{s}</li>)}</ul>
                {(x.missing_information ?? []).length > 0 && <><h3 style={{ marginTop: 14 }}>Ask on the callback</h3><div className="chips" style={{ marginTop: 6 }}>{x.missing_information.map((m) => <span className="pill warn" key={m}>{m}</span>)}</div></>}
              </div></section>
          </>}
          {tab === "transcript" && <section className="panel"><div className="panel-head"><h2>Call transcript</h2>{c.recording_url && <a className="btn" href={c.recording_url} target="_blank" rel="noreferrer"><Icon name="play" size={15} />Play recording</a>}</div><div className="panel-body"><pre className="transcript">{d.transcript ?? "No transcript for this call."}</pre></div></section>}
          {tab === "activity" && <section className="panel"><div className="panel-head"><h2>Activity</h2><span className="sub">Every step the system took for this lead</span></div><div className="panel-body">
            {d.events.length ? <ul className="timeline">{d.events.map((e, i) => <li key={i}><span className={`dot ${e.status}`} aria-hidden="true" /><span>{EVENT_TEXT[`${e.system}:${e.action}`] ?? `${titleCase(e.system)}: ${titleCase(e.action)}`}{e.status !== "ok" ? <span className="muted"> ({titleCase(e.status)})</span> : null}</span><span className="xs faint">{fmtDateTime(e.created_at)}</span></li>)}</ul> : <p className="muted">No activity recorded.</p>}
          </div></section>}
        </div>
        <aside className="stack">
          <section className="panel"><div className="panel-head"><h2>Next step</h2></div><div className="panel-body">
            {r ? <p style={{ margin: 0, fontFamily: "var(--display)", fontSize: 20, fontWeight: 600, color: r.overdue ? "var(--bad)" : undefined }}>{r.text}</p> : <p className="muted" style={{ margin: 0 }}>Nothing due.</p>}
            <div className="person" style={{ marginTop: 10 }}>{c.designer ? <><Avatar name={c.designer.name} size="sm" /><span className="small">{c.designer.name}</span></> : <span className="small muted">Studio owner</span>}</div>
            {c.booking_status === "confirmed" && <p className="pill ok" style={{ marginTop: 10 }}><Icon name="ok" size={13} />Consultation booked</p>}
          </div></section>
          <section className="panel"><div className="panel-head"><h2>Details</h2></div><div className="panel-body"><dl className="facts">{facts.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v || <span className="faint">Not said</span>}</dd></Fragment>)}</dl></div></section>
          <section className="panel"><div className="panel-head"><h2>Call</h2></div><div className="panel-body"><dl className="facts"><dt>Length</dt><dd>{minutes(c.duration_sec)}</dd><dt>Asked price</dt><dd>{c.pricing_asked ? `${c.pricing_asked} time${c.pricing_asked > 1 ? "s" : ""}` : "No"}</dd><dt>Recording</dt><dd>{c.recording_url ? <a href={c.recording_url} target="_blank" rel="noreferrer">Listen</a> : <span className="faint">None</span>}</dd><dt>Call ID</dt><dd className="xs">{c.vaani_call_id}</dd></dl></div></section>
        </aside>
      </div>
    </>
  );
}
