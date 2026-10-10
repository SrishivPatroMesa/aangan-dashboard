import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "./globals.css";
import Nav from "../components/Nav";
import Crumbs from "../components/Crumbs";
import ModeSwitch from "../components/ModeSwitch";
import Logo from "../components/Logo";
import Icon from "../components/Icon";
import { Avatar } from "../components/ui";
import { loadCore, lastLiveCall, getMode } from "../lib/data";
import { fmtTime, relative } from "../lib/format";

export const metadata = { title: "Aangan Studio · Lead desk" };
export const dynamic = "force-dynamic";

async function side() {
  try {
    const [{ calls, allCalls }, last] = await Promise.all([loadCore({ days: 90 }), lastLiveCall()]);
    return { counts: { "/": calls.filter((c) => c.needsCall).length || null, "/leads": calls.filter((c) => Date.now() - Date.parse(c.when) < 86400e3).length || null, "/recovery": allCalls.filter((c) => c.stuck).length || null }, last };
  } catch { return { counts: {}, last: null }; }
}

export default async function Layout({ children }) {
  const mode = getMode();
  const { counts, last } = await side();
  const owner = process.env.OWNER_NAME || "Srishiv Mesa";
  const ago = last ? relative(last).text.replace("overdue", "ago") : null;
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="side">
            <div className="brand"><Logo /><div><b>Aangan Studio</b><span>Lead desk, Pune</span></div></div>
            <Nav counts={counts} />
            <div className="agent-card">
              <div className="row"><span className="live-dot" aria-hidden="true" /><b>Phone agent is live</b></div>
              <div style={{ marginTop: 4 }}>Answering every call, day and night.{ago ? ` Last call ${ago}.` : ""}</div>
            </div>
          </aside>
          <div className="content">
            <header className="topbar">
              <Crumbs />
              <form className="gsearch" action="/leads" method="get" role="search">
                <Icon name="search" size={15} />
                <input type="search" name="q" placeholder="Search leads by name, phone or area" aria-label="Search leads" />
                <input type="hidden" name="view" value="all" />
              </form>
              <ModeSwitch mode={mode} />
              <a className="iconbtn" href="/leads?view=overdue" aria-label="Overdue follow-ups"><Icon name="bell" size={16} />{counts["/"] ? <span className="pip" /> : null}</a>
              <div className="me"><Avatar name={owner} /><div className="who"><b>{owner}</b><span>Owner</span></div></div>
            </header>
            <main className="main">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
