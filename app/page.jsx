import { loadCore } from "../lib/data";
import { TIERS, relative, pct, fmtDate, inr } from "../lib/format";
import { Tier, Range, Problem, Spark, Delta, Avatar, DemoNote, PageHead } from "../components/ui";
import Icon from "../components/Icon";
export const dynamic = "force-dynamic";

const lakh = (n) => (n >= 1e5 ? `₹${(n / 1e5).toFixed(n >= 1e7 ? 0 : 1)}L` : inr(n));

export default async function Today({ searchParams }) {
  const days = [7, 30, 90].includes(Number(searchParams?.days)) ? Number(searchParams.days) : 30;
  let d;
  try { d = await loadCore({ days: days * 2 }); } catch (e) { return <Problem error={e} />; }
  const now = Date.now(), cut = now - days * 86400e3;
  const calls = d.calls.filter((c) => Date.parse(c.when) >= cut), prev = d.calls.filter((c) => Date.parse(c.when) < cut);
  const n = calls.length;
  const qual = (xs) => xs.filter((c) => c.tier === "P1" || c.tier === "P2").length;
  const isBooked = (c) => c.booking_status === "confirmed" || ["consultation_booked", "consultation_held", "proposal_sent", "won"].includes(c.stage);
  const booked = calls.filter(isBooked).length;
  const wonAmt = (xs) => xs.filter((c) => c.stage === "won").reduce((a, c) => a + (c.amount ?? 0), 0);
  const inHub = calls.filter((c) => c.hubspot_contact_id).length;
  const p1 = calls.filter((c) => c.tier === "P1").length;
  const held = calls.filter((c) => ["consultation_held", "proposal_sent", "won"].includes(c.stage)).length;
  const won = calls.filter((c) => c.stage === "won").length;

  const queue = d.calls.filter((c) => c.needsCall).sort((a, b) => Date.parse(a.due ?? 0) - Date.parse(b.due ?? 0));
  const overdue = queue.filter((c) => c.due && Date.parse(c.due) < now).length;

  const span = 14, keys = Array.from({ length: span }, (_, i) => new Date(now - (span - 1 - i) * 86400e3).toISOString().slice(0, 10));
  const series = (fn) => keys.map((k) => d.calls.filter((c) => c.when.slice(0, 10) === k && fn(c)).length);
  const byDay = Object.fromEntries(keys.map((k) => [k, { P1: 0, P2: 0, P3: 0, SERVICE: 0 }]));
  for (const c of d.calls) { const k = c.when.slice(0, 10); if (byDay[k] && c.tier) byDay[k][c.tier]++; }
  const maxDay = Math.max(1, ...keys.map((k) => Object.values(byDay[k]).reduce((a, b) => a + b, 0)));

  const feed = [...calls].slice(0, 8).map((c) => {
    const who = c.caller_name ?? c.caller_phone ?? "A caller";
    if (c.stage === "won") return { ic: "ok", t: c.when, text: <><b>{who}</b> became a project{c.amount ? ` worth ${lakh(c.amount)}` : ""}</> };
    if (isBooked(c)) return { ic: "book", t: c.when, text: <><b>{who}</b> booked a consultation{c.designer ? ` with ${c.designer.name}` : ""}</> };
    if (c.tier === "SERVICE") return { ic: "warn", t: c.when, text: <><b>{who}</b> raised an issue on a live project</> };
    return { ic: "incoming", t: c.when, text: <><b>{who}</b> called{c.extraction?.location ? ` from ${c.extraction.location}` : ""} and was tiered <Tier tier={c.tier} /></> };
  });

  const steps = [["Calls answered", n, null], ["In HubSpot", inHub, n], ["P1 leads", p1, inHub], ["Consultations booked", booked, p1], ["Consultations held", held, booked], ["Projects won", won, held]];
  const team = d.designers.filter((x) => x.role === "designer").map((x) => {
    const mine = d.calls.filter((c) => c.designer_id === x.id);
    return { ...x, open: mine.filter((c) => c.needsCall).length, late: mine.filter((c) => c.needsCall && c.due && Date.parse(c.due) < now).length, booked: mine.filter(isBooked).length };
  });
  const maxOpen = Math.max(1, ...team.map((t) => t.open));
  const hourIST = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }).format(new Date()));
  const greet = hourIST < 12 ? "Good morning" : hourIST < 17 ? "Good afternoon" : "Good evening";
  const first = (process.env.OWNER_NAME || "Srishiv Mesa").split(" ")[0];
  const today = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <>
      <PageHead title={`${greet}, ${first}`} sub={`${today}. ${queue.length ? `${queue.length} ${queue.length === 1 ? "lead is" : "leads are"} waiting for a call${overdue ? `, ${overdue} overdue` : ""}.` : "Nobody is waiting for a call."}`}>
        <Range days={days} />
        <a className="btn primary" href="/leads?view=open"><Icon name="phone" size={15} />Start call list</a>
      </PageHead>
      <DemoNote mode={d.mode} />
      {d.mode === "live" && !d.liveOnly && <div className="banner"><Icon name="warn" size={16} />No live calls yet, so these numbers include test calls.</div>}
      {d.hubspotError && <div className="banner"><Icon name="warn" size={16} />HubSpot didn't respond ({d.hubspotError}). Stages may be out of date.</div>}

      <section className="kpis" aria-label="Key numbers">
        <div className="kpi"><div><span className="lab"><Icon name="incoming" size={14} />Calls answered</span><b>{n}</b><Delta now={n} before={prev.length} /></div><Spark values={series(() => true)} /></div>
        <div className="kpi"><div><span className="lab"><Icon name="spark" size={14} />Qualified leads</span><b>{pct(qual(calls), n)}</b><Delta now={qual(calls)} before={qual(prev)} /></div><Spark values={series((c) => c.tier === "P1" || c.tier === "P2")} color="var(--p1)" /></div>
        <div className="kpi"><div><span className="lab"><Icon name="calendar" size={14} />Consultations booked</span><b>{booked}</b><Delta now={booked} before={prev.filter(isBooked).length} /></div><Spark values={series(isBooked)} color="var(--p2)" /></div>
        <div className="kpi"><div><span className="lab"><Icon name="costs" size={14} />Revenue won</span><b>{lakh(wonAmt(calls))}</b><Delta now={wonAmt(calls)} before={wonAmt(prev)} /></div><Spark values={series((c) => c.stage === "won")} color="var(--ink-2)" /></div>
      </section>

      <div className="grid g-hero">
        <section className="panel" aria-labelledby="sheet-h">
          <div className="panel-head"><div><h2 id="sheet-h">Who to call next</h2><div className="sub">Sorted by response deadline. Bars fill as the deadline approaches.</div></div><a className="small" href="/leads?view=open">View all</a></div>
          {queue.length ? (
            <ul className="sheet">
              {queue.slice(0, 7).map((c) => {
                const r = relative(c.due, now);
                const start = Date.parse(c.processed_at ?? c.when), end = Date.parse(c.due ?? now);
                const frac = Math.max(0.05, Math.min(1, (now - start) / Math.max(1, end - start)));
                const x = c.extraction;
                return (
                  <li key={c.id}>
                    <span className="bar" style={{ background: TIERS[c.tier].color }} aria-hidden="true" />
                    <Avatar name={c.caller_name ?? "?"} />
                    <div className="who" style={{ minWidth: 0 }}>
                      <a href={`/leads/${c.id}`}>{c.caller_name || c.caller_phone || "Unknown caller"}</a> <Tier tier={c.tier} />
                      <div className="sub">{[x.property_type, x.location].filter(Boolean).join(", ") || c.summary || "No details captured"}{c.designer ? `  ·  ${c.designer.name}` : ""}</div>
                    </div>
                    <div className="clock"><span className={r.overdue ? "late" : "muted"}>{r.text}</span><div className="track"><div className="fill" style={{ width: `${frac * 100}%`, background: r.overdue ? "var(--bad)" : TIERS[c.tier].color }} /></div></div>
                  </li>
                );
              })}
            </ul>
          ) : <div className="empty"><b>All caught up</b>New leads appear here the moment a call ends.</div>}
        </section>

        <section className="panel" aria-labelledby="feed-h">
          <div className="panel-head"><h2 id="feed-h">Recent activity</h2><a className="small" href="/leads?view=all">All leads</a></div>
          {feed.length ? <ul className="feed">{feed.map((f, i) => <li key={i}><span className="ic"><Icon name={f.ic} size={15} /></span><div><div>{f.text}</div><div className="t">{fmtDate(f.t, { hour: "numeric", minute: "2-digit" })}</div></div></li>)}</ul> : <div className="empty">No calls in this period yet.</div>}
        </section>
      </div>

      <section className="panel" style={{ marginBottom: 16 }} aria-labelledby="pipe-h">
        <div className="panel-head"><div><h2 id="pipe-h">From call to project</h2><div className="sub">Each step shows its share of the step before</div></div><a className="small" href="/pipeline">Open pipeline</a></div>
        <div className="funnel">{steps.map(([label, v, prevV]) => (
          <div className="fstep" key={label}><b>{v}</b><span>{label}</span><em>{prevV == null ? "Last " + days + " days" : prevV ? `${pct(v, prevV)} of previous` : "—"}</em><span className="lvl" style={{ width: `${n ? Math.max(3, (v / n) * 100) : 0}%` }} aria-hidden="true" /></div>
        ))}</div>
      </section>

      <div className="grid g-2">
        <section className="panel" aria-labelledby="mix-h">
          <div className="panel-head"><h2 id="mix-h">Leads by tier, last 14 days</h2><a className="small" href="/reports">Reports</a></div>
          <div className="panel-body">
            <div className="bars" role="img" aria-label="Stacked bars of leads per day by tier">
              {keys.map((k) => <div className="colb" key={k} title={`${fmtDate(k)}: ${Object.entries(byDay[k]).map(([t, v]) => `${t} ${v}`).join(", ")}`}>{["P1", "P2", "P3", "SERVICE"].map((t) => byDay[k][t] ? <span key={t} style={{ height: `${(byDay[k][t] / maxDay) * 100}%`, background: TIERS[t].color }} /> : null)}</div>)}
            </div>
            <div className="bars-x">{keys.map((k, i) => <span key={k}>{i % 2 === 0 ? fmtDate(k).replace(" Sept", " Sep") : ""}</span>)}</div>
            <div className="legend">{["P1", "P2", "P3", "SERVICE"].map((t) => <span key={t}><i style={{ background: TIERS[t].color }} />{t === "SERVICE" ? "Existing client" : `${t} ${TIERS[t].name.toLowerCase()}`}</span>)}</div>
          </div>
        </section>
        <section className="panel" aria-labelledby="team-h">
          <div className="panel-head"><h2 id="team-h">Designers</h2><a className="small" href="/team">Team</a></div>
          <div className="table-wrap"><table>
            <thead><tr><th>Designer</th><th>Open calls</th><th className="num">Overdue</th><th className="num">Booked</th></tr></thead>
            <tbody>
              {team.length ? team.map((t) => (
                <tr key={t.id}><td><div className="person"><Avatar name={t.name} size="sm" /><span className="cell-main">{t.name}</span></div></td>
                  <td><div className="row"><div className="load" style={{ width: 90 }}><span style={{ width: `${(t.open / maxOpen) * 100}%` }} /></div>{t.open}</div></td>
                  <td className="num" style={{ color: t.late ? "var(--bad)" : undefined, fontWeight: t.late ? 600 : 400 }}>{t.late}</td><td className="num">{t.booked}</td></tr>
              )) : <tr><td colSpan={4}><div className="empty"><b>No designers yet</b>Every lead goes to the studio owner until designers are added.</div></td></tr>}
            </tbody>
          </table></div>
        </section>
      </div>
    </>
  );
}
