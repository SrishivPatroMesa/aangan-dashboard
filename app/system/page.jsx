import { loadSystem } from "../../lib/data";
import { fmtDateTime, titleCase } from "../../lib/format";
import { Problem } from "../../components/ui";
export const dynamic = "force-dynamic";
const CONN = [["gemini_api_key", "Gemini", "Reads each call"], ["hubspot_token", "HubSpot", "Saves contacts, deals and tasks"], ["calendly_token", "Calendly", "Books consultations during the call"], ["vaani_webhook_secret", "Vaani signature", "Optional extra check on incoming calls"]];

export default async function System() {
  let s;
  try { s = await loadSystem(); } catch (e) { return <Problem error={e} />; }
  return (
    <>
      <div className="page-head"><div><h1>System</h1><p className="muted">Connections, the rules the agent follows, and what it's allowed to say.</p></div></div>
      <div className="grid-2">
        <section className="panel"><div className="panel-head"><h2>Connections</h2></div>
          <div className="table-wrap"><table><tbody>
            {CONN.map(([k, name, what]) => <tr key={k}><td className="cell-main">{name}</td><td className="cell-sub">{what}</td><td>{s.secrets[k] ? <span className="pill ok">Connected</span> : <span className="pill">Not connected</span>}</td></tr>)}
          </tbody></table></div>
          <div className="panel-body"><p className="small muted" style={{ margin: "10px 0 0" }}>Last activity: {s.lastRun ? fmtDateTime(s.lastRun) : "none yet"}. The worker checks for new calls every minute.</p></div>
        </section>
        <section className="panel"><div className="panel-head"><h2>Recent activity</h2></div><div className="panel-body">
          <ul className="timeline">{s.lastEvents.map((e, i) => <li key={i}><span className={`dot ${e.status}`} aria-hidden="true" /><span>{titleCase(e.system)}: {titleCase(e.action)}</span><span className="small faint">{fmtDateTime(e.created_at)}</span></li>)}</ul>
          {!s.lastEvents.length && <p className="muted">No activity yet.</p>}
        </div></section>
      </div>
      <section className="panel" style={{ marginBottom: 18 }}><div className="panel-head"><h2>What the agent knows</h2><span className="small muted">Approved entries only are used on calls</span></div>
        <div className="table-wrap"><table><thead><tr><th>Topic</th><th>Content</th><th>Status</th></tr></thead><tbody>
          {s.kb.map((k) => <tr key={k.topic}><td className="cell-main">{titleCase(k.topic)}</td><td className="small" style={{ maxWidth: 640 }}>{k.content}</td><td>{k.approved ? <span className="pill ok">Approved</span> : <span className="pill warn">Needs your OK</span>}</td></tr>)}
        </tbody></table></div>
      </section>
      <section className="panel"><div className="panel-head"><h2>Studio rules</h2><span className="small muted">Change these in Supabase; no redeploy needed</span></div>
        <div className="table-wrap"><table><thead><tr><th>Rule</th><th>Value</th><th>Note</th></tr></thead><tbody>
          {s.rules.filter((r) => !/owner_hubspot_id/.test(r.key)).map((r) => <tr key={r.key}><td className="cell-main">{titleCase(r.key)}</td><td className="small" style={{ maxWidth: 420, overflowWrap: "anywhere" }}>{Array.isArray(r.value) ? r.value.join(", ") : typeof r.value === "object" && r.value ? Object.entries(r.value).map(([k, v]) => `${k}: ${v}`).join(", ") : String(r.value)}</td><td className="cell-sub">{r.description}</td></tr>)}
        </tbody></table></div>
      </section>
    </>
  );
}
