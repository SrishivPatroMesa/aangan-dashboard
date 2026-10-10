import { loadCore } from "../lib/data";
import { TIERS, relative, pct, fmtDate, minutes } from "../lib/format";
import { Tier, Range, Problem } from "../components/ui";
export const dynamic = "force-dynamic";

export default async function Today({ searchParams }) {
  const days = [7, 30, 90].includes(Number(searchParams?.days)) ? Number(searchParams.days) : 30;
  let d;
  try { d = await loadCore({ days }); } catch (e) { return <Problem error={e} />; }
  const { calls, designers, hubspotError, liveOnly } = d;
  const now = Date.now();
  const n = calls.length;
  const answered = calls.filter((c) => c.disposition !== "dropped_call");
  const inHub = calls.filter((c) => c.hubspot_contact_id).length;
  const p1 = calls.filter((c) => c.tier === "P1");
  const booked = calls.filter((c) => c.booking_status === "confirmed" || ["consultation_booked", "consultation_held", "proposal_sent", "won"].includes(c.stage)).length;
  const held = calls.filter((c) => ["consultation_held", "proposal_sent", "won"].includes(c.stage)).length;
  const won = calls.filter((c) => c.stage === "won").length;
  const avgDur = answered.length ? answered.reduce((a, c) => a + (c.duration_sec ?? 0), 0) / answered.length : null;

  const queue = calls.filter((c) => c.needsCall).sort((a, b) => Date.parse(a.due ?? 0) - Date.parse(b.due ?? 0));
  const overdue = queue.filter((c) => c.due && Date.parse(c.due) < now).length;

  // Tier mix per day (last 14 days of the range)
  const span = Math.min(days, 14);
  const dayKeys = Array.from({ length: span }, (_, i) => new Date(now - (span - 1 - i) * 86400e3).toISOString().slice(0, 10));
  const byDay = Object.fromEntries(dayKeys.map((k) => [k, { P1: 0, P2: 0, P3: 0, SERVICE: 0 }]));
  for (const c of calls) { const k = (c.started_at ?? c.created_at).slice(0, 10); if (byDay[k] && c.tier) byDay[k][c.tier]++; }
  const maxDay = Math.max(1, ...dayKeys.map((k) => Object.values(byDay[k]).reduce((a, b) => a + b, 0)));

  const steps = [
    ["Calls answered", n, null], ["In HubSpot", inHub, n], ["P1 leads", p1.length, inHub],
    ["Consultations booked", booked, p1.length], ["Consultations held", held, booked], ["Projects won", won, held],
  ];
  const team = designers.filter((x) => x.role === "designer").map((x) => {
    const mine = calls.filter((c) => c.designer_id === x.id);
    return { ...x, open: mine.filter((c) => c.needsCall).length, late: mine.filter((c) => c.needsCall && c.due && Date.parse(c.due) < now).length, booked: mine.filter((c) => c.booking_status === "confirmed").length };
  });

  const today = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return (
    <>
      <div className="page-head">
        <div><h1>Today</h1><p className="muted">{today}. {queue.length ? `${queue.length} ${queue.length === 1 ? "lead needs" : "leads need"} a call${overdue ? `, ${overdue} overdue` : ""}.` : "Nobody is waiting for a call."}</p></div>
        <Range days={days} />
      </div>
      {!liveOnly && <div className="banner">No live calls yet, so this page shows test and replayed calls. Real calls replace them automatically.</div>}
      {hubspotError && <div className="banner">HubSpot didn't respond ({hubspotError}), so stages and task status may be out of date.</div>}

      <div className="grid-hero">
        <section className="panel" aria-labelledby="sheet-h">
          <div className="panel-head"><h2 id="sheet-h">Who to call next</h2><a className="small" href="/leads?view=open">All open leads</a></div>
          {queue.length ? (
            <ul className="sheet">
              {queue.slice(0, 8).map((c) => {
                const r = relative(c.due, now);
                const start = Date.parse(c.processed_at ?? c.created_at), end = Date.parse(c.due ?? now);
                const frac = Math.max(0.04, Math.min(1, (now - start) / Math.max(1, end - start)));
                const x = c.extraction;
                return (
                  <li key={c.id}>
                    <span className="bar" style={{ background: TIERS[c.tier].color }} aria-hidden="true" />
                    <div className="who">
                      <a href={`/leads/${c.id}`}>{c.caller_name || c.caller_phone || "Unknown caller"}</a> <Tier tier={c.tier} />
                      <div className="sub">{[x.property_type, x.location].filter(Boolean).join(", ") || c.summary || "No details captured"}{c.designer ? `. ${c.designer.name}` : ""}</div>
                    </div>
                    <div className="clock">
                      <span className={r.overdue ? "late" : "muted"}>{r.text}</span>
                      <div className="track"><div className="fill" style={{ width: `${frac * 100}%`, background: r.overdue ? "var(--bad)" : TIERS[c.tier].color }} /></div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <p className="empty">All caught up. New leads appear here as soon as a call ends.</p>}
        </section>

        <section className="panel" aria-labelledby="period-h">
          <div className="panel-head"><h2 id="period-h">Last {days} days</h2></div>
          <div className="stats">
            <div className="stat"><b>{n}</b><span>Calls answered</span></div>
            <div className="stat"><b>{pct(calls.filter((c) => c.after_hours).length, n)}</b><span>Outside studio hours</span></div>
            <div className="stat"><b>{pct(inHub, n)}</b><span>Captured in HubSpot</span></div>
            <div className="stat"><b>{calls.filter((c) => c.pricing_asked > 0).length}</b><span>Asked about price</span></div>
            <div className="stat"><b>{minutes(avgDur)}</b><span>Average call</span></div>
            <div className="stat"><b>{calls.filter((c) => c.disposition === "dropped_call").length}</b><span>Dropped calls</span></div>
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginBottom: 18 }} aria-labelledby="pipe-h">
        <div className="panel-head"><h2 id="pipe-h">From call to project</h2><span className="small muted">Each step shows its share of the step before</span></div>
        <div className="pipe">
          {steps.map(([label, v, prev]) => (
            <div key={label}>
              <b>{v}</b><span>{label}</span><em>{prev == null ? "all calls" : prev ? `${pct(v, prev)} of previous` : "—"}</em>
              <span className="lvl" style={{ width: `${n ? Math.max(2, (v / n) * 100) : 0}%` }} aria-hidden="true" />
            </div>
          ))}
        </div>
      </section>

      <div className="grid-2">
        <section className="panel" aria-labelledby="mix-h">
          <div className="panel-head"><h2 id="mix-h">Leads by tier, per day</h2></div>
          <div className="panel-body">
            <div className="bars" role="img" aria-label="Stacked bars of P1, P2, P3 and client calls per day">
              {dayKeys.map((k) => (
                <div className="col" key={k} title={`${fmtDate(k)}: ${Object.entries(byDay[k]).map(([t, v]) => `${t} ${v}`).join(", ")}`}>
                  {["P1", "P2", "P3", "SERVICE"].map((t) => byDay[k][t] ? <span key={t} style={{ height: `${(byDay[k][t] / maxDay) * 100}%`, background: TIERS[t].color }} /> : null)}
                </div>
              ))}
            </div>
            <div className="bars-x">{dayKeys.map((k, i) => <span key={k}>{i % Math.ceil(span / 7) === 0 ? (i === 0 || k.slice(8) === "01" ? fmtDate(k) : String(Number(k.slice(8)))) : ""}</span>)}</div>
            <div className="legend">{["P1", "P2", "P3", "SERVICE"].map((t) => <span key={t}><i style={{ background: TIERS[t].color }} />{t === "SERVICE" ? "Existing client" : `${TIERS[t].label} ${TIERS[t].name.toLowerCase()}`}</span>)}</div>
          </div>
        </section>

        <section className="panel" aria-labelledby="team-h">
          <div className="panel-head"><h2 id="team-h">Designers</h2><a className="small" href="/team">Team detail</a></div>
          <div className="table-wrap"><table>
            <thead><tr><th>Designer</th><th className="num">Open</th><th className="num">Overdue</th><th className="num">Booked</th></tr></thead>
            <tbody>
              {team.length ? team.map((t) => (
                <tr key={t.id}><td className="cell-main">{t.name}</td><td className="num">{t.open}</td><td className="num" style={{ color: t.late ? "var(--bad)" : undefined }}>{t.late}</td><td className="num">{t.booked}</td></tr>
              )) : <tr><td colSpan={4} className="muted">No designers added yet. Until then, every lead goes to the studio owner.</td></tr>}
            </tbody>
          </table></div>
        </section>
      </div>
    </>
  );
}
