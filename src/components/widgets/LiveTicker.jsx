// ── LiveTicker — scrolling marquee, CoinGecko + Twelve Data (PRD B2.1) ────────
import { useEffect, useState } from "react";
import { C } from "../../lib/theme";

const DEFAULT_SYMBOLS = ["BTC", "ETH", "NVDA", "EUR/USD", "GBP/USD", "XAU/USD", "SPY"];
const REFRESH_MS = (Number(import.meta.env.VITE_TICKER_REFRESH_SEC) || 60) * 1000;
const CRYPTO_IDS = { BTC: "bitcoin", ETH: "ethereum", XAU: "tether-gold", GOLD: "tether-gold" };

export default function LiveTicker({ positions = [], refreshInterval, compact }) {
  const [quotes, setQuotes] = useState({});
  const [err, setErr] = useState(null);

  const symbols = useSymbolList(positions);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const next = {};
      const crypto = symbols.filter((s) => s in CRYPTO_IDS);
      const rest = symbols.filter((s) => !(s in CRYPTO_IDS));
      try {
        if (crypto.length) {
          const r = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${crypto.map((c) => CRYPTO_IDS[c]).join(",")}&vs_currencies=usd&include_24hr_change=true`
          );
          const d = await r.json();
          crypto.forEach((c) => {
            const o = d[CRYPTO_IDS[c]];
            if (o) next[c] = { price: o.usd, change: o.usd_24h_change };
          });
        }
      } catch { /* silent */ }
      try {
        if (rest.length && import.meta.env.VITE_TWELVE_DATA_KEY) {
          const r = await fetch(
            `https://api.twelvedata.com/quote?symbol=${rest.join(",")}&apikey=${import.meta.env.VITE_TWELVE_DATA_KEY}`
          );
          const d = await r.json();
          rest.forEach((s) => {
            const o = d[s];
            if (o && o.close) next[s] = { price: Number(o.close), change: Number(o.percent_change || 0) };
          });
        }
      } catch { /* silent */ }
      if (alive) { setQuotes(next); setErr(null); }
    };
    tick();
    const iv = setInterval(tick, REFRESH_MS);
    return () => { alive = false; clearInterval(iv); };
  }, [symbols.join(",")]);

  const items = symbols.map((s) => {
    const q = quotes[s];
    const price = q ? (s.includes("/") || s === "XAU/USD" ? `$${Number(q.price).toFixed(2)}` : `$${Number(q.price).toFixed(2)}`) : "…";
    const chg = q && q.change != null ? `${q.change >= 0 ? "+" : ""}${Number(q.change).toFixed(2)}%` : "";
    const color = q && q.change != null ? (q.change >= 0 ? C.green : C.red) : C.textDim;
    return { s, price, chg, color };
  });

  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, background: C.surface, overflow: "hidden", padding: "6px 0" }}>
      <div style={{ display: "flex", animation: "ticker 40s linear infinite", width: "max-content" }}>
        {[...items, ...items].map((it, i) => (
          <span key={i} style={{ display: "inline-flex", gap: 8, padding: "0 24px", fontFamily: C.mono, fontSize: 11, whiteSpace: "nowrap" }}>
            <span style={{ color: C.gold, fontWeight: 700 }}>{it.s}</span>
            <span style={{ color: C.text }}>{it.price}</span>
            <span style={{ color: it.color }}>{it.chg}</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } } .ticker-inner:hover { animation-play-state: paused }`}</style>
    </div>
  );
}

function useSymbolList(positions) {
  const [custom, setCustom] = useState(
    () => (import.meta.env.VITE_TICKER_SYMBOLS || DEFAULT_SYMBOLS.join(",")).split(",").map((s) => s.trim()).filter(Boolean)
  );
  const extra = (positions || []).map((p) => {
    const t = p.ticker || "";
    if (t.includes(":")) return t.split(":")[0];
    if (t.includes("/")) return t;
    return t;
  }).filter(Boolean);
  const merged = [...custom];
  extra.forEach((e) => { if (!merged.includes(e)) merged.push(e); });
  return merged;
}
