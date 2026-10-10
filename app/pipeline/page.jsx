import { loadCore } from "../../lib/data";
import { STAGES } from "../../lib/format";
import { Tier, Problem, Avatar, DemoNote, PageHead } from "../../components/ui";
import Icon from "../../components/Icon";
export const dynamic = "force-dynamic";
const COLS = [["new_enquiry", "var(--action)"], ["needs_review", "var(--p2)"], ["follow_up", "var(--p3)"], ["consultation_booked", "#1F6F78"], ["consultation_held", "#6A4C93"], ["proposal_sent", "#8A5A1C"], ["won", "var(--p1)"], ["lost", "var(--svc)"]];
const lakh = (n) => (n ? `₹${(n / 1e5).toFixed(1)}L` : null);
const inr = (n) => `₹${(n / 1e5).toFixed(1)} lakh`;

export default async function Pipeline() {
  let d;
  try { d = await loadCore({ days: 3650, includeTest: true }); } catch (e) { return <Problem error={e} />; }
  const deals = d.calls.filter((c) => c.stage);
  const open = deals.filter((c) => !["won", "lost"].includes(c.stage));
  const wonAmt = deals.filter((c) => c.stage === "won").reduce((a, c) => a + (c.amount ?? 0), 0);
  const openAmt = open.reduce((a, c) => a + (c.amount ?? 0), 0);
  return (
    <>
      <PageHead title="Pipeline" sub={`${open.length} open ${open.length === 1 ? "deal" : "deals"}${openAmt ? `, ${inr(openAmt)} in proposals` : ""}${wonAmt ? `, ${inr(wonAmt)} won` : ""}. Stages come from HubSpot.`}>
        <a className="btn" href="/leads?view=all"><Icon name="inbox" size={15} />List view</a>
      </PageHead>
      <DemoNote mode={d.mode} />
      {!deals.length && <div className="banner info"><Icon name="spark" size={16} />No deals yet. Each call tiered P1, P2 or P3 creates a deal here and in HubSpot.</div>}
      <div className="board">
        {COLS.map(([key, color]) => {
          const items = deals.filter((c) => c.stage === key);
          const sum = items.reduce((a, c) => a + (c.amount ?? 0), 0);
          return (
            <section className="col" key={key} aria-label={STAGES[key]}>
              <div className="col-head"><span><span className="dot" style={{ background: color }} />{STAGES[key]} <span className="sum">{items.length}</span></span><span className="sum">{sum ? lakh(sum) : ""}</span></div>
              {items.map((c) => (
                <a className="card" key={c.id} href={`/leads/${c.id}`}>
                  <div className="t">{c.caller_name || c.caller_phone || "Unknown caller"}</div>
                  <div className="s">{[c.extraction?.property_type, c.extraction?.location].filter(Boolean).join(", ") || "Details pending"}</div>
                  <div className="f"><Tier tier={c.tier} />{c.amount ? <span className="amt">{lakh(c.amount)}</span> : c.designer ? <Avatar name={c.designer.name} size="sm" /> : <span className="xs faint">Owner</span>}</div>
                </a>
              ))}
              {!items.length && <div className="xs faint" style={{ padding: "6px 4px" }}>No deals</div>}
            </section>
          );
        })}
      </div>
    </>
  );
}
