import { loadCore } from "../../lib/data";
import { pct, minutes, fmtDateTime, inr } from "../../lib/format";
import { Tier, Problem, DemoNote, PageHead } from "../../components/ui";
import Icon from "../../components/Icon";
export const dynamic = "force-dynamic";
const STACK = [["incoming", "Phone line", "Vaani number, any hour"], ["ear", "Ears", "Sarvam speech-to-text, Indian English and Hindi"], ["brain", "Brain", "Gemini 3.5 Flash, GPT-4o as backup"], ["volume", "Voice", "Priya, Cartesia Sonic 3.5"], ["tool", "Tools", "Studio rules, caller lookup, slots, booking"], ["webhook", "After the call", "Transcript to the lead engine"]];
const TOOLS = [["check_rules", "Checks area, scope, size and timeline against studio rules, and says what to do next"], ["lookup_caller_aangan", "Recognises returning callers from HubSpot"], ["available_slots", "Offers real consultation times (when Calendly is connected)"], ["book_consultation_aangan", "Books the chosen time; the agent only says booked after it confirms"]];

export default async function Agent() {
  let d;
  try { d = await loadCore({ days: 30 }); } catch (e) { return <Problem error={e} />; }
  const calls = d.calls, n = calls.length, answered = calls.filter((c) => c.disposition !== "dropped_call");
  const mins = calls.reduce((a, c) => a + (c.duration_sec ?? 0), 0) / 60;
  const recent = calls.slice(0, 6);
  return (
    <>
      <PageHead title="Phone agent" sub="The virtual receptionist that answers the studio line, qualifies callers and hands leads to designers.">
        <span className="pill ok"><span className="live-dot" style={{ width: 7, height: 7, boxShadow: "none" }} />Live</span>
      </PageHead>
      <DemoNote mode={d.mode} />
      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head"><div><h2>Aangan Studio receptionist</h2><div className="sub">Greets with: “Thank you for calling Aangan Studio. I'm the studio's virtual assistant, and this call is recorded so a designer can follow up.”</div></div></div>
        <div className="panel-body"><div className="pipe-line">{STACK.map(([ic, t, s], i) => <div key={t} style={{ display: "contents" }}>{i > 0 && <span className="link" aria-hidden="true" />}<div className="node"><span className="ic"><Icon name={ic} size={16} /></span><div><b>{t}</b><span>{s}</span></div></div></div>)}</div></div>
      </section>
      <section className="kpis">
        <div className="kpi"><div><span className="lab">Calls handled, 30 days</span><b>{n}</b></div></div>
        <div className="kpi"><div><span className="lab">Talk time</span><b>{Math.round(mins)} min</b></div></div>
        <div className="kpi"><div><span className="lab">Average call</span><b>{minutes(answered.length ? answered.reduce((a, c) => a + (c.duration_sec ?? 0), 0) / answered.length : null)}</b></div></div>
        <div className="kpi"><div><span className="lab">Price questions deflected</span><b>{calls.filter((c) => c.pricing_asked > 0).length}</b></div></div>
      </section>
      <div className="grid g-21">
        <section className="panel"><div className="panel-head"><h2>Recent conversations</h2><a className="small" href="/leads?view=all">All leads</a></div>
          <div className="table-wrap"><table><thead><tr><th>Caller</th><th>Outcome</th><th className="num">Length</th><th>When</th><th></th></tr></thead><tbody>
            {recent.map((c) => <tr key={c.id}><td><a className="cell-main" href={`/leads/${c.id}`}>{c.caller_name || c.caller_phone || "Unknown"}</a><div className="cell-sub">{c.summary?.slice(0, 80)}</div></td><td><Tier tier={c.tier} /></td><td className="num">{minutes(c.duration_sec)}</td><td className="cell-sub">{fmtDateTime(c.when)}</td><td>{c.recording_url ? <a className="btn" href={c.recording_url} target="_blank" rel="noreferrer"><Icon name="play" size={14} />Listen</a> : <a className="btn" href={`/leads/${c.id}?tab=transcript`}><Icon name="note" size={14} />Transcript</a>}</td></tr>)}
            {!recent.length && <tr><td colSpan={5}><div className="empty"><b>No calls yet</b>Conversations appear here as soon as the agent takes a call.</div></td></tr>}
          </tbody></table></div></section>
        <section className="panel"><div className="panel-head"><h2>What it can do</h2></div>
          <ul className="feed">{TOOLS.map(([k, t]) => <li key={k}><span className="ic"><Icon name="tool" size={14} /></span><div><div className="cell-main" style={{ fontSize: 13 }}>{k}</div><div className="t" style={{ fontSize: 12.5, color: "var(--muted)" }}>{t}</div></div></li>)}</ul>
          <div className="panel-body"><div className="formula">It never quotes prices. Asked about cost, it says pricing depends on the site, materials and scope, and offers a free consultation.</div></div>
        </section>
      </div>
    </>
  );
}
