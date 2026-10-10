import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "./globals.css";
import Nav from "../components/Nav";
import { loadCore } from "../lib/data";

export const metadata = { title: "Aangan lead desk" };
export const dynamic = "force-dynamic";

async function counts() {
  try {
    const { calls, allCalls } = await loadCore({ days: 90 });
    return {
      "/": calls.filter((c) => c.needsCall).length || null,
      "/recovery": allCalls.filter((c) => c.stuck).length || null,
    };
  } catch { return {}; }
}

export default async function Layout({ children }) {
  const c = await counts();
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="side">
            <div className="brand"><div className="brand-mark" aria-hidden="true" /><div><b>Aangan</b><span>Lead desk</span></div></div>
            <Nav counts={c} />
            <div className="side-foot">Calls are answered by the phone agent, tiered by studio rules, and kept in HubSpot.</div>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
