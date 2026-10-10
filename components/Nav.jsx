"use client";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
const GROUPS = [
  ["Workspace", [["/", "today", "Today"], ["/leads", "inbox", "Leads"], ["/pipeline", "pipeline", "Pipeline"], ["/consultations", "calendar", "Consultations"], ["/contacts", "contacts", "Contacts"]]],
  ["Insights", [["/reports", "reports", "Reports"], ["/team", "team", "Team"], ["/costs", "costs", "Costs and ROI"]]],
  ["Operations", [["/agent", "agent", "Phone agent"], ["/recovery", "recovery", "Recovery"], ["/system", "settings", "Settings"]]],
];
export default function Nav({ counts = {} }) {
  const path = usePathname();
  return (
    <nav aria-label="Main">
      {GROUPS.map(([title, items]) => (
        <div className="navgroup" key={title}>
          <p>{title}</p>
          {items.map(([href, icon, label]) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            const n = counts[href];
            return (
              <a key={href} className="navlink" href={href} aria-current={active ? "page" : undefined}>
                <Icon name={icon} size={17} /><span>{label}</span>
                {n ? <span className={`count${href === "/recovery" ? " alert" : ""}`}>{n}</span> : null}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
