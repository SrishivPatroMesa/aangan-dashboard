import { loadCore } from "../../lib/data";
import { TIERS, pct, minutes, DISPOSITIONS } from "../../lib/format";
import { Problem, Range, DemoNote, PageHead } from "../../components/ui";
export const dynamic = "force-dynamic";
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ist = (iso) => { const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", weekday: "short", hour: "numeric", hour12: false }).formatToParts(new Date(iso)); return { dow: DOW.indexOf(p.find((x) => x.type === "weekday").value), hour: Number(p.find((x) => x.type === "hour").value) % 24 }; };

function Donut({ parts }) {
  const total = parts.reduce((a, p) => a + p.v, 0); let acc = 0; const R = 54, C = 2 * Math.PI * R;
  return (
    <svg width="150" height="150" viewBox="0 0 150 150" role="img" aria-label={parts.map((p) => `${p.label} ${p.v}`).join(", ")}>
      <circle cx="75" cy="75" r={R} fill="none" stroke="var(--line-soft)" strokeWidth="18" />
      {parts.map((p) => { const len = total ? (p.v / total) * C : 0; const el = <circle key={p.label} cx="75" cy="75" r={R} fill="none" stroke={p.color} strokeWidth="18" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} transform="rotate(-90 75 75)" />; acc += len; return el; })}
      <text x="75" y="74" textAnchor="middle" style={{ font: "600 26px var(--display)", fill: "var(--ink)" }}>{total}</text>
      <text x="75" y="94" textAnchor="middle" style={{ font: "12px var(--text)", fill: "var(--muted)" }}>calls</text>
    </svg>
  );
}

export default async function Reports({ searchParams }) {
  const days = [7, 30, 90].includes(Number(searchParams?.days)) ? Number(searchParams.days) : 30;
  let d;
  try { d = await loadCore({ days }); } catch (e) { return <Problem error={e} />; }
  const calls = d.calls, n = calls.length;
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const c of calls) { const t = ist(c.when); if (t.dow >= 0) grid[t.dow][t.hour]++; }
  const maxCell = Math.max(1, ...grid.flat());
  const outside = calls.filter((c) => c.after_hours).length;
  const tiers = ["P1", "P2", "P3", "SERVICE"].map((t) => ({ label: t === "SERVICE" ? "Existing client" : `${t} ${TIERS[t].name.toLowerCase()}`, v: calls.filter((c) => c.tier === t).length, color: TIERS[t].color }));
  const count = (fn) => { const m = {}; for (const c of calls) { const k = fn(c); if (k) m[k] = (m[k] ?? 0) + 1; } return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 7); };
  const areas = count((c) => c.extraction?.location), sources = count((c) => c.extraction?.referral_source), reasons = count((c) => c.tier === "P3" ? DISPOSITIONS[c.disposition] : null);
  const HB = ({ rows }) => { const m = Math.max(1, ...rows.map((r) => r[1])); return rows.length ? rows.map(([k, v]) => <div className="hbar" key={k}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k}</span><div className="tr"><span style={{ width: `${(v / m) * 100}%` }} /></div><span className="num small">{v}</span></div>) : <p className="muted small">Not enough calls yet.</p>; };
  const answered = calls.filter((c) => c.disposition !== "dropped_call");
  return (
    <>
      <PageHead title="Reports" sub="When people call, where they're from, how they found the studio, and why some don't qualify."><Range days={days} base="/reports" /></PageHead>
      <DemoNote mode={d.mode} />
      <div className="grid g-21">
        <section className="panel"><div className="panel-head"><div><h2>When calls come in</h2><div className="sub">{pct(outside, n)} of calls arrive outside 10 am to 7 pm, when the front desk is closed</div></div></div>
          <div className="panel-body"><div className="table-wrap"><div className="heat" style={{ minWidth: 640 }}>
            <span />{Array.from({ length: 24 }, (_, h) => <span key={h} style={{ textAlign: "center" }}>{h % 3 === 0 ? h : ""}</span>)}
            {grid.map((row, i) => <div key={i} style={{ display: "contents" }}><span>{DOW[i]}</span>{row.map((v, h) => <span key={h} className="c" title={`${DOW[i]} ${h}:00, ${v} calls`} style={{ background: v ? `rgba(45,68,160,${0.18 + (v / maxCell) * 0.82})` : undefined, outline: h < 10 || h >= 19 ? "1px dashed #D3D8CF" : undefined, outlineOffset: -1 }} />)}</div>)}
          </div></div><p className="xs faint" style={{ margin: "10px 0 0" }}>Dashed cells are outside studio hours, when only the phone agent answers.</p></div>
        </section>
        <section className="panel"><div className="panel-head"><h2>Tier mix</h2></div>
          <div className="panel-body"><div className="row gap-12"><Donut parts={tiers} /><div className="legend" style={{ flexDirection: "column", gap: 8, marginTop: 0 }}>{tiers.map((t) => <span key={t.label}><i style={{ background: t.color }} />{t.label}: <b>{t.v}</b></span>)}</div></div></div>
        </section>
      </div>
      <div className="grid g-3">
        <section className="panel"><div className="panel-head"><h2>Top areas</h2></div><div className="panel-body"><HB rows={areas} /></div></section>
        <section className="panel"><div className="panel-head"><h2>How they found us</h2></div><div className="panel-body"><HB rows={sources} /></div></section>
        <section className="panel"><div className="panel-head"><h2>Why leads were P3</h2></div><div className="panel-body"><HB rows={reasons} /></div></section>
      </div>
      <section className="panel"><div className="stat-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", borderTop: 0 }}>
        <div className="stat" style={{ borderBottom: 0 }}><b>{n}</b><span>Calls in period</span></div>
        <div className="stat" style={{ borderBottom: 0 }}><b>{minutes(answered.length ? answered.reduce((a, c) => a + (c.duration_sec ?? 0), 0) / answered.length : null)}</b><span>Average call length</span></div>
        <div className="stat" style={{ borderBottom: 0 }}><b>{pct(calls.filter((c) => c.pricing_asked > 0).length, n)}</b><span>Asked about price (never quoted)</span></div>
        <div className="stat" style={{ borderBottom: 0, borderRight: 0 }}><b>{pct(calls.filter((c) => c.disposition === "dropped_call").length, n)}</b><span>Dropped before details</span></div>
      </div></section>
    </>
  );
}
