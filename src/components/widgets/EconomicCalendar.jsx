// ── EconomicCalendar — Twelve Data calendar + TradingEconomics iframe fallback ─
// PRD B2.6. Impact filter toggles, 2-hour highlight, next-5-events.
import { useEffect, useState } from "react";
import { C } from "../../lib/theme";

const IMPACT_COLOR = { high: C.red, medium: C.gold, low: C.textDim };
const IMPACT_EMOJI = { high: "🔴", medium: "🟡", low: "⚪" };
const FILTERS = ["high", "medium", "low"];

export default function EconomicCalendar({ refreshInterval = 3600000 }) {
  const [events, setEvents] = useState([]);
  const [impact, setImpact] = useState(import.meta.env.VITE_CALENDAR_IMPACT || "high");
  const [currency, setCurrency] = useState(null);
  const [err, setErr] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!import.meta.env.VITE_TWELVE_DATA_KEY) { setErr(true); return; }
    let alive = true;
    const load = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const end = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
        const r = await fetch(
          `https://api.twelvedata.com/economic_calendar?start_date=${today}&end_date=${end}&importance=${impact}&apikey=${import.meta.env.VITE_TWELVE_DATA_KEY}`
        );
        const d = await r.json();
        if (alive && d.events) { setEvents(d.events); setErr(false); }
        else if (alive) { setErr(true); }
      } catch { if (alive) setErr(true); }
    };
    load();
    const iv = setInterval(load, refreshInterval);
    return () => { alive = false; clearInterval(iv); };
  }, [refreshInterval, impact]);

  const currencies = ["USD", "GBP", "NGN", "SAR", "HKD"];
  const filtered = currency ? events.filter((e) => (e.country || e.currency || "").toUpperCase().includes(currency)) : events;
  const shown = expanded ? filtered : filtered.slice(0, 5);

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: C.gold, fontFamily: C.mono, textTransform: "uppercase" }}>Economic Calendar</span>
        <div style={{ display: "flex", gap: 6 }}>
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setImpact(f)} style={{
              background: impact === f ? C.surfaceHigh : "none", border: `1px solid ${impact === f ? C.gold : C.border}`,
              borderRadius: 4, padding: "3px 8px", fontSize: 9, fontFamily: C.mono, cursor: "pointer", color: impact === f ? C.gold : C.textDim,
            }}>{f.toUpperCase()}</button>
          ))}
          {currencies.map((c) => (
            <button key={c} onClick={() => setCurrency(currency === c ? null : c)} style={{
              background: currency === c ? C.surfaceHigh : "none", border: `1px solid ${currency === c ? C.gold : C.border}`,
              borderRadius: 4, padding: "3px 6px", fontSize: 9, fontFamily: C.mono, cursor: "pointer", color: currency === c ? C.gold : C.textDim,
            }}>{c}</button>
          ))}
        </div>
      </div>

      {err ? (
        <iframe src="https://cdn.tradingeconomics.com/calendar" title="Economic calendar" style={{ width: "100%", height: 400, border: "none" }} />
      ) : shown.length === 0 ? (
        <div style={{ fontFamily: C.mono, fontSize: 11, color: C.textDim, textAlign: "center", padding: "20px 0" }}>
          No {impact} events in the next 7 days.
        </div>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, fontFamily: C.mono }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.textDim, fontSize: 9, letterSpacing: "0.06em", textAlign: "left" }}>
                {["TIME (UTC)", "EVENT", "COUNTRY", "IMPACT", "FORECAST", "PREV"].map((h) => <th key={h} style={{ padding: "5px 8px" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {shown.map((e, i) => {
                const ts = new Date(`${e.event_date}T${e.event_time || "00:00"}:00Z`).getTime();
                const in2h = ts - Date.now() < 2 * 3600e3 && ts > Date.now();
                const imp = (e.importance || "medium").toLowerCase();
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, borderLeft: in2h ? `3px solid ${C.gold}` : "none", background: in2h ? C.surfaceHigh : "transparent" }}>
                    <td style={{ padding: "6px 8px", color: C.textDim }}>{e.event_time || "—"}</td>
                    <td style={{ padding: "6px 8px", color: C.text }}>{e.event}</td>
                    <td style={{ padding: "6px 8px", color: C.textSub }}>{e.country || "—"}</td>
                    <td style={{ padding: "6px 8px" }}>{IMPACT_EMOJI[imp] || "⚪"} <span style={{ color: IMPACT_COLOR[imp] }}>{imp.toUpperCase()}</span></td>
                    <td style={{ padding: "6px 8px", color: C.textSub }}>{e.forecast || "—"}</td>
                    <td style={{ padding: "6px 8px", color: C.textSub }}>{e.previous || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length > 5 && (
            <button onClick={() => setExpanded(!expanded)} style={{ marginTop: 8, background: "none", border: `1px solid ${C.border}`, borderRadius: 4, padding: "4px 10px", fontFamily: C.mono, fontSize: 9, color: C.textDim, cursor: "pointer" }}>
              {expanded ? "SHOW LESS" : `SHOW FULL WEEK (${filtered.length})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
