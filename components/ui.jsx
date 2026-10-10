import { TIERS } from "../lib/format";
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
  if (call.booking_status === "confirmed" || call.stage === "consultation_booked") return <span className="pill ok">Booked</span>;
  return <span className="pill">In HubSpot</span>;
}
export function Range({ days, base = "" }) {
  return (
    <div className="range" role="group" aria-label="Date range">
      {[7, 30, 90].map((d) => <a key={d} href={`${base}?days=${d}`} aria-current={days === d ? "true" : undefined}>{d} days</a>)}
    </div>
  );
}
export function Problem({ error }) {
  return <div className="panel"><div className="panel-body" style={{ paddingTop: 18 }}><h2>Can't load the data</h2><p className="muted">{String(error?.message ?? error)}</p><p className="small muted">Check the Supabase settings in Vercel → Project → Settings → Environment Variables, then redeploy.</p></div></div>;
}
