// ── TVChart — TradingView lightweight chart with entry/target/stop lines ───────
// PRD B2.2. Uses lightweight-charts; falls back to iframe embed if unavailable.
import { useEffect, useRef, useState } from "react";
import { C } from "../../lib/theme";

export function toTVSymbol(ticker, exchange) {
  const t = String(ticker || "");
  if (t.includes("/")) {
    const [pair, exch] = t.split(":");
    return `${exch || exchange || "BINANCE"}:${pair.replace("/", "")}`;
  }
  if (t.includes(":")) {
    const [sym, exch] = t.split(":");
    return `${exch}:${sym}`;
  }
  return `NASDAQ:${t}`;
}

export default function TVChart({ ticker, exchange, entry, target, stop, interval }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [fallback, setFallback] = useState(false);
  const [hasLib, setHasLib] = useState(true);

  const sym = toTVSymbol(ticker, exchange);
  const iv = interval === "INTRADAY" ? "5" : "D";

  useEffect(() => {
    let chart, series;
    let disposed = false;

    const load = async () => {
      let lib;
      try {
        lib = await import("lightweight-charts");
      } catch {
        if (!disposed) setFallback(true);
        return;
      }
      if (disposed || !containerRef.current) return;
      setHasLib(true);
      try {
        chart = lib.createChart(containerRef.current, {
          width: containerRef.current.clientWidth || 600,
          height: 320,
          layout: { background: { color: C.surface }, textColor: C.textSub },
          grid: { vertLines: { color: C.border }, horzLines: { color: C.border } },
          timeScale: { borderColor: C.border },
        });
        series = chart.addLineSeries({ color: C.gold, lineWidth: 2 });
        // fetch candles from a free OHLC source (Twelve Data if key, else Binance for crypto)
        await loadData(series, sym);
        // price lines
        if (entry) series.createPriceLine({ price: Number(entry), color: C.gold, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "Entry" });
        if (target) series.createPriceLine({ price: Number(target), color: C.green, lineWidth: 1, lineStyle: 0, axisLabelVisible: true, title: "Target" });
        if (stop) series.createPriceLine({ price: Number(stop), color: C.red, lineWidth: 1, lineStyle: 0, axisLabelVisible: true, title: "Stop" });
        chartRef.current = chart;
      } catch {
        if (!disposed) setFallback(true);
      }
    };

    load();
    const onResize = () => { if (chartRef.current && containerRef.current) chartRef.current.applyOptions({ width: containerRef.current.clientWidth }); };
    window.addEventListener("resize", onResize);
    return () => { disposed = true; window.removeEventListener("resize", onResize); if (chart) chart.remove(); };
  }, [sym, iv, entry, target, stop]);

  if (fallback || !hasLib) {
    // iframe embed fallback (PRD Q3)
    const tvSym = sym.split(":").join(":");
    return (
      <iframe
        title={`${ticker} chart`}
        src={`https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(sym)}&interval=${iv}&theme=dark&style=1`}
        style={{ width: "100%", height: 320, border: "none" }}
      />
    );
  }

  return <div ref={containerRef} style={{ width: "100%", height: 320 }} />;
}

async function loadData(series, sym) {
  // crypto: Binance public klines (no key)
  if (sym.includes("BINANCE:")) {
    const pair = sym.split(":")[1].replace("USDT", "USDT");
    const r = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1d&limit=120`);
    const d = await r.json();
    if (Array.isArray(d)) {
      series.setData(d.map((k) => ({ time: Math.floor(k[0] / 1000), open: +k[1], high: +k[2], low: +k[3], close: +k[4] })));
      return;
    }
  }
  // Twelve Data fallback if key present
  if (import.meta.env.VITE_TWELVE_DATA_KEY) {
    try {
      const r = await fetch(`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(sym)}&interval=1day&outputsize=120&apikey=${import.meta.env.VITE_TWELVE_DATA_KEY}`);
      const d = await r.json();
      if (d.values) {
        series.setData(d.values.map((v) => ({
          time: Math.floor(new Date(v.datetime).getTime() / 1000),
          open: +v.open, high: +v.high, low: +v.low, close: +v.close,
        })).reverse());
        return;
      }
    } catch { /* fall through */ }
  }
  // empty state
  series.setData([]);
}
