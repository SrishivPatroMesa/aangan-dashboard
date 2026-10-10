import { loadBookings } from "../../lib/data";
import { fmtDate, fmtTime } from "../../lib/format";
import { toneFor } from "../../lib/people";
import { Problem, Avatar, DemoNote, PageHead } from "../../components/ui";
import Icon from "../../components/Icon";
export const dynamic = "force-dynamic";
const HOURS = Array.from({ length: 10 }, (_, i) => 9 + i);
const istParts = (iso) => { const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date(iso)); const g = (t) => p.find((x) => x.type === t)?.value; return { day: `${g("year")}-${g("month")}-${g("day")}`, hour: Number(g("hour")), min: Number(g("minute")) }; };

export default async function Consultations({ searchParams }) {
  const wk = Number(searchParams?.week ?? 0) || 0;
  let d;
  try { d = await loadBookings(); } catch (e) { return <Problem error={e} />; }
  const todayIST = istParts(new Date().toISOString()).day;
  const base = new Date(`${todayIST}T12:00:00+05:30`); // midday IST avoids date-line slips
  const wd = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", weekday: "short" }).format(base);
  const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(wd);
  const monday = new Date(base.getTime() - dow * 86400e3 + wk * 7 * 86400e3);
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getTime() + i * 86400e3));
  const dayKey = (dt) => istParts(dt.toISOString()).day;
  const evs = (d.bookings ?? []).map((b) => ({ ...b, p: istParts(b.slot_start), designer: d.designers.find((x) => x.id === b.designer_id) }));
  const upcoming = evs.filter((e) => Date.parse(e.slot_start) >= Date.now()).sort((a, b) => Date.parse(a.slot_start) - Date.parse(b.slot_start)).slice(0, 8);
  const weekEvs = evs.filter((e) => days.some((x) => dayKey(x) === e.p.day));
  return (
    <>
      <PageHead title="Consultations" sub="Site visits and studio meetings booked from calls, by designer.">
        <a className="btn" href={`/consultations?week=${wk - 1}`} aria-label="Previous week">Previous</a>
        <a className="btn" href="/consultations">This week</a>
        <a className="btn" href={`/consultations?week=${wk + 1}`} aria-label="Next week">Next</a>
      </PageHead>
      <DemoNote mode={d.mode} />
      {d.mode === "live" && <div className="banner info"><Icon name="calendar" size={16} />Calendly isn't connected yet, so the phone agent hands bookings to designers instead of booking live. Bookings appear here once Calendly is connected.</div>}
      <div className="grid g-21">
        <section className="panel">
          <div className="panel-head"><h2>{fmtDate(days[0].toISOString())} to {fmtDate(days[6].toISOString(), { year: "numeric" })}</h2><span className="sub">{weekEvs.length} {weekEvs.length === 1 ? "consultation" : "consultations"} this week</span></div>
          <div className="table-wrap"><div className="cal" style={{ minWidth: 720 }}>
            <div />
            {days.map((dt) => { const k = dayKey(dt); return <div key={k} className={`dh${k === todayIST ? " today" : ""}`}>{new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short" }).format(dt)}<b>{Number(k.slice(8))}</b></div>; })}
            {HOURS.map((h) => (
              <div key={h} style={{ display: "contents" }}>
                <div className="hr">{h > 12 ? `${h - 12} pm` : h === 12 ? "12 pm" : `${h} am`}</div>
                {days.map((dt) => { const k = dayKey(dt); const here = evs.filter((e) => e.p.day === k && e.p.hour === h); return (
                  <div className="slot" key={k + h}>{here.map((e) => (
                    <a key={e.id} className="ev" href={e.call_id ? `/leads/${e.call_id}` : "#"} style={{ background: toneFor(e.designer?.name ?? "x"), top: 3 + (e.p.min / 60) * 46 }} title={`${e.caller_name}, ${fmtTime(e.slot_start)}`}>
                      <b>{e.caller_name}</b>{e.kind}{e.location ? `, ${e.location}` : ""}
                    </a>))}</div>); })}
              </div>
            ))}
          </div></div>
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Upcoming</h2></div>
          {upcoming.length ? <ul className="feed">{upcoming.map((e) => (
            <li key={e.id}><span className="ic" style={{ background: toneFor(e.designer?.name ?? "x"), color: "#fff" }}><Icon name="calendar" size={14} /></span>
              <div><div><a className="cell-main" href={e.call_id ? `/leads/${e.call_id}` : "#"}>{e.caller_name}</a></div><div className="t">{fmtDate(e.slot_start, { weekday: "short" })}, {fmtTime(e.slot_start)}  ·  {e.kind}{e.designer ? ` with ${e.designer.name}` : ""}</div></div></li>
          ))}</ul> : <div className="empty"><b>Nothing booked yet</b>Booked consultations show up here and on the calendar.</div>}
          <div className="panel-body"><div className="legend">{d.designers.filter((x) => x.role === "designer").map((x) => <span key={x.id}><i style={{ background: toneFor(x.name) }} />{x.name}</span>)}</div></div>
        </section>
      </div>
    </>
  );
}
