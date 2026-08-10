// ── SignalCard — renders TradingAgents output with analyst report tabs ────────
import { useState } from "react";
import { C, fmt } from "../lib/theme";

const TABS = [
  ["fundamentals", "Fundamentals"],
  ["sentiment", "Sentiment"],
  ["news", "News"],
  ["technical", "Technical"],
];

const SIGNAL_COLOR = (s) => (s === "BUY" ? C.green : s === "SELL" ? C.red : C.textDim);

function Badge({ label, color = C.gold }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
      color, border: `1px solid ${color}`, borderRadius: 3,
      padding: "1px 5px", fontFamily: C.mono, whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

export default function SignalCard({ signal, onFileThesis }) {
  const [tab, setTab] = useState("fundamentals");
  if (!signal) return null;
  const reports = signal.analyst_reports || {};

  return (
    <div style={{ border: `1px solid ${signal.gate_status === "CLEAR" ? C.borderHi : C.red}`, borderRadius: 8, background: C.surfaceHigh, overflow: "hidden" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 13, fontWeight: 800, fontFamily: C.mono, color: C.text }}>{signal.ticker}</span>
        <Badge label={signal.signal} color={SIGNAL_COLOR(signal.signal)} />
        <Badge label={signal.gate_status === "CLEAR" ? "GATE CLEAR" : `GATE ${signal.gate_failed}`} color={signal.gate_status === "CLEAR" ? C.green : C.red} />
        <span style={{ marginLeft: "auto", fontSize: 10, color: C.textDim, fontFamily: C.mono }}>
          conf {(Number(signal.confidence) * 100).toFixed(0)}% · R/R {fmt.num(signal.reward_risk, 2)}x
        </span>
      </div>

      {/* price levels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
        {[
          ["ENTRY", signal.entry_ref],
          ["TARGET", signal.target],
          ["INVALIDATION", signal.invalidation],
        ].map(([l, v]) => (
          <div key={l}>
            <div style={{ fontSize: 9, color: C.textDim, fontFamily: C.mono }}>{l}</div>
            <div style={{ fontSize: 12, color: C.text, fontFamily: C.mono, fontWeight: 700 }}>{v != null ? fmt.usd(v) : "—"}</div>
          </div>
        ))}
      </div>

      {/* thesis + bull/bear */}
      <div style={{ padding: "10px 14px", fontSize: 11, color: C.textSub, fontFamily: C.mono, lineHeight: 1.8, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ marginBottom: 6 }}>
          <span style={{ color: C.gold }}>Bull:</span> {signal.bull_case || "—"}
        </div>
        <div>
          <span style={{ color: C.gold }}>Bear:</span> {signal.bear_case || "—"}
        </div>
        {signal.thesis && (
          <div style={{ marginTop: 6, color: C.textDim }}>{signal.thesis}</div>
        )}
      </div>

      {/* analyst tabs */}
      <div>
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
          {TABS.map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "6px 12px", fontSize: 9, fontFamily: C.mono, letterSpacing: "0.08em",
              color: tab === key ? C.gold : C.textDim,
              borderBottom: `2px solid ${tab === key ? C.gold : "transparent"}`,
              textTransform: "uppercase",
            }}>{label}</button>
          ))}
        </div>
        <div style={{ padding: "10px 14px", fontSize: 11, color: C.textSub, fontFamily: C.mono, minHeight: 60, lineHeight: 1.8 }}>
          {reports[tab] || "No report for this dimension."}
        </div>
      </div>

      {/* actions */}
      <div style={{ display: "flex", gap: 10, padding: "10px 14px", borderTop: `1px solid ${C.border}` }}>
        {signal.gate_status === "CLEAR" && (
          <button onClick={onFileThesis} style={{
            padding: "8px 14px", borderRadius: 5, border: "none",
            background: C.gold, color: C.bg, fontFamily: C.mono, fontSize: 10,
            fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer",
          }}>FILE THESIS → BUY</button>
        )}
        <span style={{ alignSelf: "center", fontSize: 9, color: C.textDim, fontFamily: C.mono }}>
          {signal.sources?.length || 0} sources
        </span>
      </div>
    </div>
  );
}
