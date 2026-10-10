// Stable colour and initials per person, so a designer looks the same on the board, calendar and team pages.
const TONES = ["#2D44A0", "#2E6B4E", "#8A5A1C", "#6A4C93", "#1F6F78", "#9B2F2F", "#46607A", "#7A4E2D"];
export function toneFor(key = "") { let h = 0; for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return TONES[h % TONES.length]; }
export function initials(name = "") { const p = String(name || "?").trim().split(/\s+/); return ((p[0]?.[0] ?? "?") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase(); }
