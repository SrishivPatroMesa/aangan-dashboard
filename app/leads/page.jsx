import { db, when } from "../../lib/db";
export const dynamic = "force-dynamic";
const VIEWS = { all: "All", P1: "P1", P2: "P2 review", P3: "P3 follow-up", SERVICE: "Escalations", booked: "Booked", unassigned: "Unassigned", recovery: "Recovery" };

export default async function Leads({ searchParams }) {
  const view = searchParams?.view ?? "all";
  let q = db().from("call_records").select("id,vaani_call_id,source,caller_name,caller_phone,tier,disposition,status,booking_status,assigned_owner_id,created_at,started_at,summary,extraction").order("created_at", { ascending: false }).limit(300);
  if (["P1", "P2", "P3", "SERVICE"].includes(view)) q = q.eq("tier", view);
  if (view === "booked") q = q.eq("booking_status", "confirmed");
  if (view === "unassigned") q = q.is("assigned_owner_id", null).not("tier", "is", null);
  if (view === "recovery") q = q.in("status", ["needs_attention", "waiting_credentials"]);
  const { data, error } = await q;
  if (error) return <p>Could not load leads: {error.message}</p>;
  return (
    <>
      <h1>Leads</h1>
      <p className="muted">Designers work these in HubSpot; this view is for the owner and for anything that hasn't reached HubSpot yet.</p>
      <div className="filters">{Object.entries(VIEWS).map(([k, l]) => <a key={k} href={`/leads?view=${k}`} className={k === view ? "on" : ""}>{l}</a>)}</div>
      <div className="card"><table><thead><tr><th>When</th><th>Caller</th><th>Area</th><th>Tier</th><th>Disposition</th><th>Status</th><th>Booking</th></tr></thead><tbody>
        {(data ?? []).map((c) => (
          <tr key={c.id}>
            <td>{when(c.started_at ?? c.created_at)}{c.source !== "vaani" ? <span className="muted"> · {c.source}</span> : null}</td>
            <td><a href={`/leads/${c.id}`}>{c.caller_name || c.caller_phone || c.vaani_call_id}</a></td>
            <td>{c.extraction?.location ?? "—"}</td>
            <td>{c.tier ? <span className={`chip ${c.tier}`}>{c.tier}</span> : "—"}</td>
            <td>{c.disposition?.replace(/_/g, " ") ?? "—"}</td>
            <td><span className={`badge ${c.status === "done" ? "" : c.status === "needs_attention" ? "bad" : "warn"}`}>{c.status}</span></td>
            <td>{c.booking_status ?? "—"}</td>
          </tr>))}
        {!(data ?? []).length && <tr><td colSpan={7} className="muted">No leads in this view.</td></tr>}
      </tbody></table></div>
    </>
  );
}
