"use client";
import { usePathname } from "next/navigation";
const NAMES = { "": "Today", leads: "Leads", pipeline: "Pipeline", consultations: "Consultations", contacts: "Contacts", reports: "Reports", team: "Team", costs: "Costs and ROI", agent: "Phone agent", recovery: "Recovery", system: "Settings" };
export default function Crumbs() {
  const parts = usePathname().split("/").filter(Boolean);
  const top = NAMES[parts[0] ?? ""] ?? "";
  return <div className="crumbs"><span>Aangan Studio</span><span aria-hidden="true">/</span><b>{top}{parts[1] ? " / Lead" : ""}</b></div>;
}
