// ── CryptoDominance — BTC.D + ETH.D from CoinGecko /global (PRD B2.5) ─────────
import { useEffect, useState } from "react";
import { C } from "../../lib/theme";

export default function CryptoDominance({ refreshInterval = 300000 }) {
  const [data, setData] = useState(null);
  const [hist, setHist] = useState([]);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("https://api.coingecko.com/api/v3/global");
        const d = await r.json();
        if (alive && d.data) {
          const btc = d.data.bitcoin_dominance_percentage;
          const eth = d.data.ethereum_dominance_percentage;
          setData({ btc, eth });
          setHist((h) => [...h.slice(-6), btc]);
          setErr(false);
        }
      } catch { if (alive) setErr(true); }
    };
    load();
    const iv = setInterval(load, refreshInterval);
    return () => { alive = false; clearInterval(iv); };
  }, [refreshInterval]);

  if (err) {
    return <WidgetBox><div style={{ color: C.red, fontFamily: C.mono, fontSize: 11 }}>Dominance unavailable <button onClick={() => window.location.reload()} style={{ marginLeft: 8, background: "none", border: `1px solid ${C.border}`, color: C.textDim, fontFamily: C.mono, fontSize: 9, borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}>RETRY</button></div></WidgetBox>;
  }

  const btc = data?.btc ?? null;
  const eth = data?.eth ?? null;
  const rising = hist.length >= 2 && hist[hist.length - 1] >= hist[hist.length - 2];
  const arrow = rising ? "▲" : "▼";
  const arrowColor = rising ? C.gold : C.blue;

  const W = 140, H = 30;
  const spark = hist.length >= 2
    ? (() => {
        const min = Math.min(...hist), max = Math.max(...hist), range = max - min || 1;
        return hist.map((v, i) => `${i === 0 ? "M" : "L"}${(i / (hist.length - 1)) * W},${H - 4 - ((v - min) / range) * (H - 8)}`).join(" ");
      })()
    : null;

  return (
    <WidgetBox>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono, letterSpacing: "0.08em" }}>CRYPTO DOMINANCE</span>
        <span style={{ fontSize: 11, color: arrowColor, fontFamily: C.mono, cursor: "help" }} title="BTC.D rising = risk-off in crypto. BTC.D falling = altcoin season.">{arrow}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: C.mono, lineHeight: 1 }}>{btc != null ? `${btc.toFixed(1)}%` : "…"}</div>
          <div style={{ fontSize: 9, color: C.textDim, fontFamily: C.mono }}>BTC.D</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.textSub, fontFamily: C.mono }}>{eth != null ? `${eth.toFixed(1)}%` : "…"}</div>
          <div style={{ fontSize: 9, color: C.textDim, fontFamily: C.mono }}>ETH.D</div>
        </div>
      </div>
      {spark && (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 8, display: "block" }}>
          <path d={spark} fill="none" stroke={arrowColor} strokeWidth="2" />
        </svg>
      )}
    </WidgetBox>
  );
}

function WidgetBox({ children }) {
  return <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>{children}</div>;
}
