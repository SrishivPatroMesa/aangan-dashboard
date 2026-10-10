import { loadCore } from "../../lib/data";
import { STAGES, fmtDate } from "../../lib/format";
import { Tier, Problem, Avatar, DemoNote, PageHead } from "../../components/ui";
export const dynamic = "force-dynamic";
export default async function Contacts({ searchParams }) {
  const q = String(searchParams?.q ?? "").trim().toLowerCase();
  let d;
  try { d = await loadCore({ days: 3650, includeTest: true }); } catch (e) { return <Problem error={e} />; }
  const map = new Map();
  for (const c of d.calls) {
    const key = c.caller_phone || c.id;
    const p = map.get(key) ?? { key, name: c.caller_name, phone: c.caller_phone, calls: [], area: c.extraction?.location };
    p.calls.push(c); if (!p.name && c.caller_name) p.name = c.caller_name; if (!p.area && c.extraction?.location) p.area = c.extraction.location;
    map.set(key, p);
  }
  const people = [...map.values()].map((p) => ({ ...p, last: p.calls.sort((a, b) => Date.parse(b.when) - Date.parse(a.when))[0] })).filter((p) => !q || [p.name, p.phone, p.area].some((s) => s && s.toLowerCase().includes(q))).sort((a, b) => Date.parse(b.last.when) - Date.parse(a.last.when));
  return (
    <>
      <PageHead title="Contacts" sub={`${people.length} people have called the studio. Each is matched by phone number, the same way HubSpot does.`} />
      <DemoNote mode={d.mode} />
      <form className="toolbar" action="/contacts" method="get"><input className="search" type="search" name="q" defaultValue={q} placeholder="Search contacts" aria-label="Search contacts" /><button className="btn" type="submit">Search</button></form>
      <section className="panel"><div className="table-wrap"><table>
        <thead><tr><th>Contact</th><th>Area</th><th className="num">Calls</th><th>Latest tier</th><th>Stage</th><th>Owner</th><th>Last call</th></tr></thead>
        <tbody>{people.map((p) => (
          <tr key={p.key}>
            <td><div className="person"><Avatar name={p.name ?? "?"} /><div><a className="cell-main" href={`/leads/${p.last.id}`}>{p.name || "Unknown caller"}</a><div className="cell-sub">{p.phone || "Number withheld"}</div></div></div></td>
            <td>{p.area || <span className="faint">Unknown</span>}</td><td className="num">{p.calls.length}</td><td><Tier tier={p.last.tier} /></td>
            <td>{p.last.stage ? STAGES[p.last.stage] : <span className="faint">None</span>}</td>
            <td>{p.last.designer ? <div className="person"><Avatar name={p.last.designer.name} size="sm" />{p.last.designer.name}</div> : <span className="faint">Studio owner</span>}</td>
            <td className="cell-sub">{fmtDate(p.last.when, { year: "numeric" })}</td>
          </tr>))}
          {!people.length && <tr><td colSpan={7}><div className="empty"><b>No contacts</b>{q ? "Nothing matches that search." : "Contacts appear after the first call."}</div></td></tr>}
        </tbody></table></div></section>
    </>
  );
}
