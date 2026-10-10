import { loadCore } from "../../lib/data";
import { pct } from "../../lib/format";
import { Range, Problem, Avatar, DemoNote, PageHead } from "../../components/ui";
export const dynamic = "force-dynamic";

export default async function Team({ searchParams }) {
  const days = [7, 30, 90].includes(Number(searchParams?.days)) ? Number(searchParams.days) : 30;
  let d;
  try { d = await loadCore({ days }); } catch (e) { return <Problem error={e} />; }
  const now = Date.now();
  const people = [...d.designers.filter((x) => x.role === "designer"), { id: null, name: "Studio owner (unassigned)", areas: [] }];
  const rows = people.map((p) => {
    const mine = d.calls.filter((c) => (p.id ? c.designer_id === p.id : !c.designer_id) && c.tier);
    const open = mine.filter((c) => c.needsCall);
    return {
      ...p, total: mine.length, p1: mine.filter((c) => c.tier === "P1").length, p2: mine.filter((c) => c.tier === "P2").length,
      open: open.length, late: open.filter((c) => c.due && Date.parse(c.due) < now).length,
      booked: mine.filter((c) => c.booking_status === "confirmed" || c.stage === "consultation_booked").length,
      held: mine.filter((c) => ["consultation_held", "proposal_sent", "won"].includes(c.stage)).length,
      won: mine.filter((c) => c.stage === "won").length,
    };
  });
  const maxOpen = Math.max(1, ...rows.map((r) => r.open));
  return (
    <>
      <PageHead title="Team" sub="Who holds which leads, what's overdue, and how each designer converts."><Range days={days} base="/team" /></PageHead>
      <DemoNote mode={d.mode} />
      <section className="panel">
        <div className="table-wrap"><table>
          <thead><tr><th>Designer</th><th>Areas</th><th className="num">Leads</th><th className="num">P1</th><th className="num">P2</th><th>Open calls</th><th className="num">Overdue</th><th className="num">Booked</th><th className="num">Held</th><th className="num">Won</th><th className="num">Lead to booking</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.name}>
              <td><div className="person"><Avatar name={r.name} size="sm" /><span className="cell-main">{r.name}</span></div></td>
              <td className="cell-sub">{r.areas?.length ? r.areas.join(", ") : "Any"}</td>
              <td className="num">{r.total}</td><td className="num">{r.p1}</td><td className="num">{r.p2}</td>
              <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div className="load" style={{ width: 90 }}><span style={{ width: `${(r.open / maxOpen) * 100}%` }} /></div>{r.open}</div></td>
              <td className="num" style={{ color: r.late ? "var(--bad)" : undefined, fontWeight: r.late ? 600 : 400 }}>{r.late}</td>
              <td className="num">{r.booked}</td><td className="num">{r.held}</td><td className="num">{r.won}</td><td className="num">{pct(r.booked, r.total)}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </section>
      {d.designers.length === 0 && <p className="muted small" style={{ marginTop: 14 }}>No designers added yet. Send their names and areas, and new leads will be shared between them automatically.</p>}
    </>
  );
}
