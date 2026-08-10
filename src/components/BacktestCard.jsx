// ── BacktestCard — inline backtest result: Sharpe, DD, win rate, alpha ────────
import { C, fmt } from "../lib/theme";

function Metric({ label, value, good }) {
  return (
    <div style={{ background: C.surface, borderRadius: 6, border: `1px solid ${C.border}`, padding: "8px 10px" }}>
      <div style={{ fontSize: 9, color: C.textDim, fontFamily: C.mono, letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, fontFamily: C.mono, color: good ? C.green : C.text, marginTop: 3 }}>{value}</div>
    </div>
  );
}

export default function BacktestCard({ result, onRetry }) {
  if (!result) return null;

  const metrics = [
    { label: "SHARPE", value: fmt.num(result.sharpe, 2), good: result.sharpe >= 1 },
    { label: "MAX DRAWDOWN", value: fmt.pct(result.max_drawdown * 100), good: result.max_drawdown > -0.2 },
    { label: "WIN RATE", value: fmt.pct(result.win_rate * 100), good: result.win_rate >= 0.5 },
    { label: "ALPHA vs SPY", value: fmt.pct(result.alpha_vs_spy * 100), good: result.alpha_vs_spy > 0 },
  ];

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: C.surfaceHigh, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 10, color: C.textSub, fontFamily: C.mono, letterSpacing: "0.08em" }}>BACKTEST RESULT</span>
        {onRetry && <button onClick={onRetry} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 4, color: C.textDim, fontFamily: C.mono, fontSize: 9, padding: "3px 8px", cursor: "pointer" }}>RE-RUN</button>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {metrics.map(m => <Metric key={m.label} {...m} />)}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 10, fontFamily: C.mono }}>
        {result.benchmark_return != null && <span style={{ color: C.textDim }}>benchmark {fmt.pct(result.benchmark_return * 100)}</span>}
        {result.total_return != null && <span style={{ color: C.textDim }}>total {fmt.pct(result.total_return * 100)}</span>}
        {result.artifact_url && (
          <a href={result.artifact_url} target="_blank" rel="noreferrer" style={{ color: C.gold }}>artifact →</a>
        )}
      </div>
    </div>
  );
}
