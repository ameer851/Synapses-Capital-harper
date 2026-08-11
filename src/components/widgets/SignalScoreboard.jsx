// ── SignalScoreboard — win-rate banner from /bridge/performance (PRD B2.7) ────
import { useEffect, useState } from "react";
import { C } from "../../lib/theme";
import { bridge, bridgeConfigured } from "../../lib/bridge";

const CLASSES = ["CRYPTO", "OPTIONS", "EQUITY", "FOREX", "FUTURES"];

function winRateColor(rate) {
  if (rate == null) return C.textDim;
  if (rate >= 0.6) return C.green;
  if (rate >= 0.4) return C.gold;
  return C.red;
}

function Card({ title, total, rate, avgRR, overall }) {
  const empty = !total;
  const rateColor = winRateColor(empty ? null : rate);
  return (
    <div style={{
      flex: 1, minWidth: 130, padding: "10px 12px", borderRadius: 8,
      background: overall ? C.surfaceHigh : C.surface,
      border: overall ? `1px solid ${C.gold}` : `1px solid ${C.border}`,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 9, fontFamily: C.mono, color: overall ? C.gold : C.textDim, letterSpacing: "0.08em", fontWeight: 700 }}>{title}</div>
      {empty ? (
        <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono, marginTop: 8 }}>— No signals yet</div>
      ) : (
        <>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: C.mono, color: rateColor, marginTop: 4 }}>
            {(rate * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: 9, fontFamily: C.mono, color: C.textDim, marginTop: 2 }}>
            avg R/R {avgRR != null ? avgRR.toFixed(2) : "—"}x · {total} signals
          </div>
        </>
      )}
    </div>
  );
}

export default function SignalScoreboard({ refreshToken = 0 }) {
  const [perf, setPerf] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!bridgeConfigured()) return;
    bridge.performance().then(setPerf).catch(() => setErr(true));
  }, [refreshToken]);

  if (!bridgeConfigured()) return null;

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <Card title="OVERALL" overall total={perf?.overall?.total_signals} rate={perf?.overall?.win_rate} avgRR={perf?.overall?.avg_rr_achieved} />
      {CLASSES.map((c) => {
        const r = perf?.by_class?.[c];
        return <Card key={c} title={c} total={r?.total_signals} rate={r?.win_rate} avgRR={r?.avg_rr_achieved} />;
      })}
    </div>
  );
}
