import { loadCore } from "../../lib/data";
import { STAGES, relative, fmtDateTime } from "../../lib/format";
import { Tier, Status, Problem, Avatar, DemoNote, PageHead } from "../../components/ui";
import Icon from "../../components/Icon";
export const dynamic = "force-dynamic";

const VIEWS = [
  ["open", "Needs a call", (c) => c.needsCall], ["new", "New today", (c) => Date.now() - Date.parse(c.when) < 86400e3],
  ["P1", "P1", (c) => c.tier === "P1"], ["P2", "P2 review", (c) => c.tier === "P2"], ["P3", "P3 follow-up", (c) => c.tier === "P3"],
  ["SERVICE", "Client issues", (c) => c.tier === "SERVICE"], ["overdue", "Overdue", (c) => c.needsCall && c.due && Date.parse(c.due) < Date.now()],
  ["unassigned", "Unassigned", (c) => (c.tier === "P1" || c.tier === "P2") && !c.designer], ["booked", "Booked", (c) => c.booking_status === "confirmed" || c.stage === "consultation_booked"],
  ["closed", "Won and lost", (c) => c.stage === "won" || c.stage === "lost"], ["all", "All leads", () => true],
];

export default async function Leads({ searchParams }) {
  const view = VIEWS.find((v) => v[0] === searchParams?.view) ?? VIEWS[0];
  const q = String(searchParams?.q ?? "").trim().toLowerCase();
  let d;
  try { d = await loadCore({ days: 3650, includeTest: true }); } catch (e) { return <Problem error={e} />; }
  const all = d.calls;
  const match = (c) => !q || [c.caller_name, c.caller_phone, c.extraction?.location, c.extraction?.property_type, c.summary].some((s) => s && String(s).toLowerCase().includes(q));
  const rows = all.filter(view[2]).filter(match).sort((a, b) => ["open", "overdue"].includes(view[0]) ? Date.parse(a.due ?? 0) - Date.parse(b.due ?? 0) : Date.parse(b.when) - Date.parse(a.when));
  return (
    <>
      <PageHead title="Leads" sub="Every call, with its tier, pipeline stage and next call. Designers work these in HubSpot; this view follows along.">
        <a className="btn" href={`/api/export?view=${view[0]}${q ? `&q=${encodeURIComponent(q)}` : ""}`}><Icon name="download" size={15} />Export CSV</a>
        <a className="btn primary" href="/pipeline"><Icon name="pipeline" size={15} />Board view</a>
      </PageHead>
      <DemoNote mode={d.mode} />
      <nav className="tabs" aria-label="Lead views">
        {VIEWS.map(([key, label, fn]) => <a key={key} href={`/leads?view=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} aria-current={view[0] === key ? "page" : undefined}>{label}<span className="n">{all.filter(fn).length}</span></a>)}
      </nav>
      <form className="toolbar" action="/leads" method="get">
        <input type="hidden" name="view" value={view[0]} />
        <input className="search" type="search" name="q" defaultValue={q} placeholder="Filter by name, phone or area" aria-label="Filter leads" />
        <button className="btn" type="submit"><Icon name="filter" size={14} />Filter</button>
        {q && <a className="small" href={`/leads?view=${view[0]}`}>Clear</a>}
        <span className="small muted" style={{ marginLeft: "auto" }}>{rows.length} {rows.length === 1 ? "lead" : "leads"}</span>
      </form>
      <section className="panel">
        <div className="table-wrap"><table>
          <thead><tr><th>Lead</th><th>Project</th><th>Tier</th><th>Stage</th><th>Owner</th><th>Next call</th><th>Called</th></tr></thead>
          <tbody>
            {rows.map((c) => {
              const r = c.needsCall ? relative(c.due) : null;
              return (
                <tr key={c.id}>
                  <td><div className="person"><Avatar name={c.caller_name ?? "?"} size="sm" /><div style={{ minWidth: 0 }}><a className="cell-main" href={`/leads/${c.id}`}>{c.caller_name || "Unknown caller"}</a><div className="cell-sub">{c.caller_phone || "Number withheld"}{c.source !== "vaani" ? `  ·  ${c.source}` : ""}</div></div></div></td>
                  <td>{[c.extraction?.property_type, c.extraction?.location].filter(Boolean).join(", ") || <span className="faint">Not captured</span>}</td>
                  <td><Tier tier={c.tier} /></td>
                  <td>{c.stuck ? <Status call={c} /> : c.stage ? STAGES[c.stage] : <span className="faint">{c.tier === "SERVICE" ? "Escalation" : "Not in pipeline"}</span>}</td>
                  <td>{c.designer ? <div className="person"><Avatar name={c.designer.name} size="sm" /><span>{c.designer.name}</span></div> : <span className="faint">Studio owner</span>}</td>
                  <td>{r ? <span className={r.overdue ? "late" : ""}>{r.text}</span> : <span className="faint">None</span>}</td>
                  <td className="cell-sub">{fmtDateTime(c.when)}</td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={7}><div className="empty"><b>{q ? "No matches" : "Nothing here"}</b>{q ? "Try a different name, number or area." : "No leads in this view right now."}</div></td></tr>}
          </tbody>
        </table></div>
      </section>
    </>
  );
}
