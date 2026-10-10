import { TIERS } from "../lib/format";
import { toneFor, initials } from "../lib/people";
import Icon from "./Icon";
export function Tier({ tier }) {
  if (!tier) return <span className="pill">Not tiered</span>;
  const t = TIERS[tier];
  return <span className={`tier ${tier}`} title={t.name}><i aria-hidden="true" />{t.label}</span>;
}
export function Status({ call }) {
  if (call.status === "needs_attention") return <span className="pill bad">Needs attention</span>;
  if (call.status === "waiting_credentials") return <span className="pill warn">Waiting</span>;
  if (call.status !== "done") return <span className="pill">Processing</span>;
  if (call.stage === "won") return <span className="pill ok">Won</span>;
  if (call.stage === "lost") return <span className="pill">Lost</span>;
  if (call.booking_status === "confirmed") return <span className="pill ok">Booked</span>;
  return <span className="pill info">In HubSpot</span>;
}
export function Avatar({ name, size = "", tone }) {
  return <span className={`av ${size}`} style={{ background: tone ?? toneFor(name) }} aria-hidden="true">{initials(name)}</span>;
}
export function Range({ days, base = "" }) {
  return <div className="range" role="group" aria-label="Date range">{[7, 30, 90].map((d) => <a key={d} href={`${base}?days=${d}`} aria-current={days === d ? "true" : undefined}>{d}d</a>)}</div>;
}
export function Spark({ values, color = "var(--action)", w = 92, h = 34 }) {
  const max = Math.max(1, ...values), n = Math.max(2, values.length);
  const pts = values.map((v, i) => [(i / (n - 1)) * w, h - 3 - (v / max) * (h - 8)]);
  const line = pts.map((p) => p.join(",")).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true"><polygon points={area} fill={color} opacity=".09" /><polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>;
}
export function Delta({ now, before }) {
  if (before == null || !before) return null;
  const d = before ? Math.round(((now - before) / before) * 100) : 100;
  if (d === 0) return <span className="delta flat">No change vs previous</span>;
  return <span className={`delta ${d > 0 ? "up" : "down"}`}><Icon name={d > 0 ? "up" : "down"} size={13} />{Math.abs(d)}% vs previous</span>;
}
export function PageHead({ title, sub, children }) {
  return <div className="page-head"><div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div>{children && <div className="actions">{children}</div>}</div>;
}
export function Problem({ error }) {
  return <div className="panel"><div className="empty"><b>Can't load the data</b>{String(error?.message ?? error)}<br /><span className="small">Check the Supabase settings in Vercel, then redeploy.</span></div></div>;
}
export function DemoNote({ mode }) {
  return mode === "demo" ? <div className="banner info"><Icon name="spark" size={16} />Demo data: a sample month of calls for presentations. Switch to Live in the top bar to see real calls.</div> : null;
}
