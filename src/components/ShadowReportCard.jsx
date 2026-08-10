// ── ShadowReportCard — shadow account summary: violations, exits, delta ───────
import { C, fmt } from "../lib/theme";

export default function ShadowReportCard({ report }) {
  if (!report) return null;
  const s = report.summary || {};

  const rows = [
    ["TRADES ANALYSED", s.trades_analysed, null],
    ["RULE VIOLATIONS", s.rule_violations, s.rule_violations > 0 ? C.red : C.green],
    ["EARLY EXITS", s.early_exits, null],
    ["MISSED SIGNALS", s.missed_signals, null],
    ["COUNTERFACTUAL Δ", `${s.counterfactual_pnl_delta > 0 ? "+" : ""}${fmt.usd(s.counterfactual_pnl_delta)}`, s.counterfactual_pnl_delta > 0 ? C.green : C.red],
  ];

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: C.surfaceHigh, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 10, color: C.textSub, fontFamily: C.mono, letterSpacing: "0.08em" }}>SHADOW ACCOUNT</span>
        {report.report_url && (
          <a href={report.report_url} target="_blank" rel="noreferrer" style={{ fontSize: 10, fontFamily: C.mono, color: C.gold, textDecoration: "none" }}>full report →</a>
        )}
      </div>

      {rows.map(([label, value, color]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}`, fontSize: 11, fontFamily: C.mono }}>
          <span style={{ color: C.textSub }}>{label}</span>
          <span style={{ color: color || C.text, fontWeight: 700 }}>{value}</span>
        </div>
      ))}

      {report.telegram_delivered && (
        <div style={{ marginTop: 8, fontSize: 9, color: C.textDim, fontFamily: C.mono }}>delivered to Telegram ✓</div>
      )}
    </div>
  );
}
