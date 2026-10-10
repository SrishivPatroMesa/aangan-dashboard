import { loadCore } from "../../lib/data";
import { STAGES, relative, fmtDateTime } from "../../lib/format";
import { Tier, Status, Problem } from "../../components/ui";
export const dynamic = "force-dynamic";

const VIEWS = [
  ["open", "Needs a call", (c) => c.needsCall],
  ["new", "New today", (c) => Date.now() - Date.parse(c.created_at) < 86400e3],
  ["P1", "P1 and bookings", (c) => c.tier === "P1"],
  ["P2", "P2 review", (c) => c.tier === "P2"],
  ["P3", "P3 follow-up", (c) => c.tier === "P3"],
  ["SERVICE", "Client issues", (c) => c.tier === "SERVICE"],
  ["overdue", "Overdue", (c) => c.needsCall && c.due && Date.parse(c.due) < Date.now()],
  ["unassigned", "Unassigned", (c) => (c.tier === "P1" || c.tier === "P2") && !c.designer],
  ["booked", "Booked", (c) => c.booking_status === "confirmed" || c.stage === "consultation_booked"],
  ["closed", "Won and lost", (c) => c.stage === "won" || c.stage === "lost"],
  ["all", "All", () => true],
];

export default async function Leads({ searchParams }) {
  const view = VIEWS.find((v) => v[0] === searchParams?.view) ?? VIEWS[0];
  const q = String(searchParams?.q ?? "").trim().toLowerCase();
  let d;
  try { d = await loadCore({ days: 3650, includeTest: true }); } catch (e) { return <Problem error={e} />; }
  const all = d.calls;
  const match = (c) => !q || [c.caller_name, c.caller_phone, c.extraction?.location, c.extraction?.property_type, c.summary].some((s) => s && String(s).toLowerCase().includes(q));
  const rows = all.filter(view[2]).filter(match).sort((a, b) => view[0] === "open" || view[0] === "overdue" ? Date.parse(a.due ?? 0) - Date.parse(b.due ?? 0) : Date.parse(b.created_at) - Date.parse(a.created_at));
  return (
    <>
      <div className="page-head">
        <div><h1>Leads</h1><p className="muted">Every call, with its tier, stage and next call. Designers update stages in HubSpot; this list follows.</p></div>
      </div>
      <nav className="tabs" aria-label="Lead views">
        {VIEWS.map(([key, label, fn]) => (
          <a key={key} href={`/leads?view=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} aria-current={view[0] === key ? "page" : undefined}>{label}<span className="n">{all.filter(fn).length}</span></a>
        ))}
      </nav>
      <form className="toolbar" action="/leads" method="get">
        <input type="hidden" name="view" value={view[0]} />
        <input className="search" type="search" name="q" defaultValue={q} placeholder="Search name, phone or area" aria-label="Search leads" />
        <button className="btn" type="submit">Search</button>
        {q && <a className="small" href={`/leads?view=${view[0]}`}>Clear search</a>}
      </form>
      <section className="panel">
        <div className="table-wrap"><table>
          <thead><tr><th>Caller</th><th>Project</th><th>Tier</th><th>Stage</th><th>Designer</th><th>Next call</th><th>Called</th></tr></thead>
          <tbody>
            {rows.map((c) => {
              const r = c.needsCall ? relative(c.due) : null;
              return (
                <tr key={c.id}>
                  <td><a className="cell-main" href={`/leads/${c.id}`}>{c.caller_name || "Unknown caller"}</a><div className="cell-sub">{c.caller_phone || "Number withheld"}{c.source !== "vaani" ? ` (${c.source})` : ""}</div></td>
                  <td>{[c.extraction?.property_type, c.extraction?.location].filter(Boolean).join(", ") || <span className="faint">Not captured</span>}</td>
                  <td><Tier tier={c.tier} /></td>
                  <td>{c.stuck ? <Status call={c} /> : c.stage ? STAGES[c.stage] : <span className="faint">{c.tier === "SERVICE" ? "Escalation task" : "Not in pipeline"}</span>}</td>
                  <td>{c.designer?.name ?? <span className="faint">Owner</span>}</td>
                  <td>{r ? <span style={{ color: r.overdue ? "var(--bad)" : undefined, fontWeight: r.overdue ? 600 : 400 }}>{r.text}</span> : <span className="faint">None</span>}</td>
                  <td className="cell-sub">{fmtDateTime(c.started_at ?? c.created_at)}</td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={7} className="empty">{q ? "No leads match that search." : "No leads in this view."}</td></tr>}
          </tbody>
        </table></div>
      </section>
    </>
  );
}
