// ── MarketClock — 5-market open/close pills, DST-safe via Intl (PRD B2.4) ─────
import { useEffect, useState } from "react";
import { C } from "../../lib/theme";
import { MARKETS, marketStateForTesting as marketState } from "../../lib/marketClockCore";

const STATE_COLOR = { open: C.green, closed: C.red, pre: C.gold, post: C.gold };

export default function MarketClock({ refreshInterval = 1000 }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), refreshInterval);
    return () => clearInterval(iv);
  }, [refreshInterval]);

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "10px 0" }}>
      {MARKETS.map((m) => {
        const s = marketState(m.tz, m.open, m.close);
        const c = STATE_COLOR[s.state];
        return (
          <div key={m.name} style={{
            flex: 1, minWidth: 140, display: "flex", alignItems: "center", gap: 10,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px",
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text, fontFamily: C.mono }}>{m.name}</div>
              <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono }}>{s.t} local</div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <span style={{ fontSize: 10, fontFamily: C.mono, fontWeight: 700, color: c }}>{s.label}</span>
              {s.note && <div style={{ fontSize: 9, color: C.gold }}>{s.note}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
