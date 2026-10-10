"use client";
import { usePathname } from "next/navigation";
const items = [
  ["/", "Today"], ["/leads", "Leads"], ["/team", "Team"], ["/costs", "Costs and ROI"], ["/recovery", "Recovery"], ["/system", "System"],
];
export default function Nav({ counts = {} }) {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Main">
      {items.map(([href, label]) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        const n = counts[href];
        return (
          <a key={href} href={href} aria-current={active ? "page" : undefined}>
            <span>{label}</span>
            {n ? <span className={`count${href === "/recovery" ? " alert" : ""}`}>{n}</span> : null}
          </a>
        );
      })}
    </nav>
  );
}
