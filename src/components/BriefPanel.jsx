// ── BriefPanel — today's daily brief on the Overview tab ──────────────────────
import { useEffect, useState } from "react";
import { C, fmt } from "../lib/theme";
import { bridge, bridgeConfigured } from "../lib/bridge";

const HEALTH_COLOR = { INTACT: C.green, WATCH: C.gold, INVALIDATED: C.red };

export default function BriefPanel() {
  const [brief, setBrief] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!bridgeConfigured()) return;
    bridge.brief().then(setBrief).catch(e => setErr(e.message));
  }, []);

  if (!bridgeConfigured()) return null;

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: C.surfaceHigh, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: C.gold, fontFamily: C.mono, textTransform: "uppercase" }}>Daily Brief</span>
        <span style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono }}>
          {brief ? `NAV ${fmt.usd(brief.nav)} · ${brief.regime}` : "loading…"}
        </span>
      </div>

      {err && <div style={{ fontSize: 10, color: C.red, fontFamily: C.mono }}>✗ {err}</div>}

      {brief && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {/* market overview */}
            <div>
              <div style={{ fontSize: 9, color: C.textDim, fontFamily: C.mono, letterSpacing: "0.08em", marginBottom: 6 }}>MARKET OVERVIEW</div>
              {Object.entries(brief.market_overview || {}).map(([m, text]) => (
                <div key={m} style={{ padding: "4px 0", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontFamily: C.mono }}>
                  <span style={{ color: C.gold }}>{m}</span>
                  <span style={{ color: C.textDim }}> — {text}</span>
                </div>
              ))}
            </div>

            {/* positions health */}
            <div>
              <div style={{ fontSize: 9, color: C.textDim, fontFamily: C.mono, letterSpacing: "0.08em", marginBottom: 6 }}>THESIS HEALTH</div>
              {(brief.positions || []).length === 0 ? (
                <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono }}>No open positions.</div>
              ) : brief.positions.map(p => (
                <div key={p.ticker} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontFamily: C.mono }}>
                  <span style={{ color: C.text }}>{p.ticker}</span>
                  <span style={{ color: HEALTH_COLOR[p.thesis_health] || C.textDim }}>{p.thesis_health}</span>
                </div>
              ))}
            </div>
          </div>

          {(brief.top_candidates || []).length > 0 && (
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {brief.top_candidates.map(c => (
                <span key={c.ticker} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 4, border: `1px solid ${C.border}`, fontFamily: C.mono, color: C.textSub }}>
                  {c.ticker} {c.signal} {c.score}
                </span>
              ))}
            </div>
          )}

          {brief.telegram_delivered && (
            <div style={{ marginTop: 8, fontSize: 9, color: C.textDim, fontFamily: C.mono }}>delivered to Telegram ✓</div>
          )}
        </>
      )}
    </div>
  );
}
