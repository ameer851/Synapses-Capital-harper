// ── Market clock core logic — pure, testable (PRD B2.4 / B5.3) ────────────────

export const MARKETS = [
  { name: "NYSE/NAS", tz: "America/New_York", open: "09:30", close: "16:00" },
  { name: "LSE", tz: "Europe/London", open: "08:00", close: "16:30" },
  { name: "NSE-NG", tz: "Africa/Lagos", open: "10:00", close: "14:30" },
  { name: "Tadawul", tz: "Asia/Riyadh", open: "10:00", close: "15:00" },
  { name: "HKEX", tz: "Asia/Hong_Kong", open: "09:30", close: "16:00" },
];

// Pure state computation. `nowIso` defaults to the real now; tests pass a fixed time.
export function marketStateForTesting(tz, open, close, nowIso) {
  const now = nowIso ? new Date(nowIso) : new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const hm = get("hour") + get("minute");
  const dow = get("weekday");
  const t = Number(get("hour")) * 60 + Number(get("minute"));
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const oMin = oh * 60 + om;
  const cMin = ch * 60 + cm;
  if (dow === "Sat" || dow === "Sun") return { state: "closed", label: "CLOSED", note: "⚠ weekend", t: hm };
  if (t < oMin) return { state: "pre", label: "PRE", t: hm };
  if (t <= cMin) return { state: "open", label: "OPEN", t: hm };
  return { state: "post", label: "POST", t: hm };
}
