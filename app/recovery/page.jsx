import { loadCore, isPublic } from "../../lib/data";
import { fmtDateTime, titleCase } from "../../lib/format";
import { Tier, Problem, PageHead } from "../../components/ui";
export const dynamic = "force-dynamic";

export default async function Recovery() {
  let d;
  try { d = await loadCore({ days: 3650, includeTest: true }); } catch (e) { return <Problem error={e} />; }
  const stuck = d.calls.filter((c) => c.stuck);
  return (
    <>
      <PageHead title="Recovery" sub="Calls that haven't reached HubSpot yet. Nothing is lost: each retries on its own, and you can retry by hand." />
      <section className="panel">
        <div className="table-wrap"><table>
          <thead><tr><th>Caller</th><th>Called</th><th>Tier</th><th>What's wrong</th><th className="num">Attempts</th><th></th></tr></thead>
          <tbody>
            {stuck.map((c) => (
              <tr key={c.id}>
                <td><a className="cell-main" href={`/leads/${c.id}`}>{c.caller_name || c.caller_phone || c.vaani_call_id}</a></td>
                <td className="cell-sub">{fmtDateTime(c.started_at ?? c.created_at)}</td>
                <td><Tier tier={c.tier} /></td>
                <td>{c.waiting_on ? `Waiting for ${titleCase(c.waiting_on)}` : c.last_error ?? "Processing is taking longer than usual"}</td>
                <td className="num">{c.attempts ?? 0}</td>
                <td>{isPublic() ? <span className="xs faint">Retries automatically</span> : <form action="/api/retry" method="post"><input type="hidden" name="id" value={c.id} /><button className="btn">Retry now</button></form>}</td>
              </tr>
            ))}
            {!stuck.length && <tr><td colSpan={6} className="empty">Nothing stuck. Every call has reached HubSpot.</td></tr>}
          </tbody>
        </table></div>
      </section>
    </>
  );
}
