export const TIERS = {
  P1: { label: "P1", name: "Book now", color: "var(--p1)" },
  P2: { label: "P2", name: "Designer review", color: "var(--p2)" },
  P3: { label: "P3", name: "Follow-up", color: "var(--p3)" },
  SERVICE: { label: "Client", name: "Existing client", color: "var(--svc)" },
};
export const STAGES = {
  new_enquiry: "New enquiry", needs_review: "Needs review", follow_up: "Follow-up",
  consultation_booked: "Consultation booked", consultation_held: "Consultation held",
  proposal_sent: "Proposal sent", won: "Won", lost: "Lost",
};
export const DISPOSITIONS = {
  book_consultation: "Book a consultation", designer_review: "Designer review", dropped_call: "Call dropped",
  not_serviceable: "Not serviceable", advice_only: "Wanted advice only", timeline_too_short: "Timeline too short",
  exploring: "Still exploring", insufficient_information: "Too little information", needs_human: "Needs a person",
  existing_client_escalation: "Existing client issue",
};
const tz = "Asia/Kolkata";
export const fmtDate = (iso, opts = {}) => iso ? new Intl.DateTimeFormat("en-IN", { timeZone: tz, day: "numeric", month: "short", ...opts }).format(new Date(iso)) : "—";
export const fmtTime = (iso) => iso ? new Intl.DateTimeFormat("en-IN", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso)) : "—";
export const fmtDateTime = (iso) => iso ? `${fmtDate(iso)}, ${fmtTime(iso)}` : "—";
export const inr = (n) => (n == null ? "Not reported" : "₹" + Math.round(n).toLocaleString("en-IN"));
export const pct = (a, b) => (b ? Math.round((a / b) * 100) + "%" : "—");
export const minutes = (sec) => (sec == null ? "—" : `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`);
export function relative(dueIso, now = Date.now()) {
  if (!dueIso) return { text: "No deadline", overdue: false };
  const diff = Date.parse(dueIso) - now, abs = Math.abs(diff);
  const h = Math.floor(abs / 3600e3), m = Math.floor((abs % 3600e3) / 60e3), d = Math.floor(h / 24);
  const span = d >= 1 ? `${d}d ${h % 24}h` : h >= 1 ? `${h}h ${m}m` : `${m}m`;
  return diff < 0 ? { text: `${span} overdue`, overdue: true } : { text: `due in ${span}`, overdue: false };
}
export const titleCase = (s) => (s ? s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "—");
