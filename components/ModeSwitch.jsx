"use client";
import { usePathname } from "next/navigation";
export default function ModeSwitch({ mode }) {
  const back = encodeURIComponent(usePathname());
  return (
    <div className="modes" role="group" aria-label="Data source">
      <a href={`/api/mode?m=live&back=${back}`} aria-current={mode === "live" ? "true" : undefined}>Live</a>
      <a href={`/api/mode?m=demo&back=${back}`} aria-current={mode === "demo" ? "true" : undefined}>Demo</a>
    </div>
  );
}
