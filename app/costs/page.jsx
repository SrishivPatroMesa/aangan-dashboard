import { loadCore } from "../../lib/data";
import { inr } from "../../lib/format";
import { Range, Problem } from "../../components/ui";
export const dynamic = "force-dynamic";
const VENDOR = { vaani: "Vaani voice minutes", gemini: "Gemini (reading calls)", hubspot: "HubSpot", calendly: "Calendly", supabase: "Supabase", vercel: "Vercel" };

export default async function Costs({ searchParams }) {
  const days = [7, 30, 90].includes(Number(searchParams?.days)) ? Number(searchParams.days) : 30;
  let d;
  try { d = await loadCore({ days }); } catch (e) { return <Problem error={e} />; }
  const R = d.rules;
  const v = {};
  for (const c of d.costs) { const x = (v[c.vendor] ??= { actual: 0, estimated: 0, missing: 0, records: 0, units: 0, unit: c.unit }); x.records++; x.units += Number(c.units || 0); if (c.amount_inr == null) x.missing++; else x[c.source === "actual" ? "actual" : "estimated"] += Number(c.amount_inr); }
  const fixed = (R.fixed_costs_monthly ?? []).map((f) => ({ ...f, prorated: Number(f.inr || 0) * (days / 30) }));
  const variable = Object.values(v).reduce((a, x) => a + x.actual + x.estimated, 0);
  const total = variable + fixed.reduce((a, f) => a + f.prorated, 0);
  const incomplete = Object.values(v).some((x) => x.missing > 0);
  const calls = d.calls.length, booked = d.calls.filter((c) => c.booking_status === "confirmed" || c.stage === "consultation_booked").length;
  const wonAmt = d.calls.filter((c) => c.stage === "won").reduce((a, c) => a + (c.amount ?? 0), 0);
  const margin = R.gross_margin_pct != null ? Number(R.gross_margin_pct) : null;
  const roi = margin != null && total ? (wonAmt * margin - total) / total : null;
  const minsSaved = calls * Number(R.front_desk_minutes_per_call ?? 4.9);
  const Tag = ({ kind }) => <span className={`pill ${kind === "Actual" ? "ok" : kind === "Estimated" ? "warn" : ""}`}>{kind}</span>;
  return (
    <>
      <div className="page-head"><div><h1>Costs and ROI</h1><p className="muted">What the system costs to run, and what it brings in. Every number says whether it's actual, estimated or not reported.</p></div><Range days={days} base="/costs" /></div>
      <div className="grid-2">
        <section className="panel"><div className="stats" style={{ borderTop: 0 }}>
          <div className="stat"><b>{inr(total)}</b><span>Total cost{incomplete ? " (some costs not reported)" : ""}</span></div>
          <div className="stat"><b>{calls ? inr(total / calls) : "—"}</b><span>Per call answered</span></div>
          <div className="stat"><b>{booked ? inr(total / booked) : "—"}</b><span>Per consultation booked</span></div>
          <div className="stat"><b>{(minsSaved / 60).toFixed(1)} h</b><span>Front-desk time saved (estimate)</span></div>
        </div></section>
        <section className="panel"><div className="panel-head"><h2>Return on investment</h2></div><div className="panel-body">
          <p style={{ margin: 0, fontFamily: "var(--display)", fontSize: 28, fontWeight: 600 }}>{roi == null ? "Not yet available" : `${Math.round(roi * 100)}%`}</p>
          <p className="small muted" style={{ margin: "4px 0 0" }}>{roi == null ? (margin == null ? "Add your gross margin % in studio rules to calculate this." : "Needs won deals with amounts in HubSpot.") : `From ${inr(wonAmt)} won at ${Math.round(margin * 100)}% margin.`}</p>
          <div className="formula">ROI = (won revenue × gross margin − total cost) ÷ total cost. Time saved = calls answered × {R.front_desk_minutes_per_call ?? 4.9} minutes of front-desk time per call.</div>
        </div></section>
      </div>
      <section className="panel"><div className="panel-head"><h2>Cost lines</h2></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Line</th><th>Usage</th><th className="num">Amount</th><th>Source</th></tr></thead>
          <tbody>
            {Object.entries(v).map(([k, x]) => (
              <tr key={k}><td className="cell-main">{VENDOR[k] ?? k}</td><td className="cell-sub">{x.unit === "seconds" ? `${Math.round(x.units / 60)} min` : `${Math.round(x.units).toLocaleString("en-IN")} ${x.unit}`} over {x.records} {x.records === 1 ? "call" : "calls"}</td>
                <td className="num">{x.actual + x.estimated ? inr(x.actual + x.estimated) : "—"}</td>
                <td>{x.missing === x.records ? <Tag kind="Not reported" /> : x.actual ? <Tag kind="Actual" /> : <Tag kind="Estimated" />}{x.missing && x.missing < x.records ? <span className="small muted"> {x.missing} calls missing</span> : null}</td></tr>
            ))}
            {fixed.map((f) => <tr key={f.name}><td className="cell-main">{f.name}</td><td className="cell-sub">Monthly, pro-rated to {days} days</td><td className="num">{inr(f.prorated)}</td><td><Tag kind="Actual" /></td></tr>)}
            {!fixed.length && <tr><td className="cell-main">Plans (HubSpot, Calendly, Vaani, Vercel)</td><td className="cell-sub">Add monthly amounts in studio rules</td><td className="num">—</td><td><Tag kind="Not reported" /></td></tr>}
          </tbody>
        </table></div>
      </section>
    </>
  );
}
