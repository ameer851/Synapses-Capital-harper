// ── ScreenProgress — SSE-driven progress bar for Vibe-Trading swarm runs ──────
import { useEffect, useRef, useState } from "react";
import { C } from "../lib/theme";
import { screen } from "../lib/bridge";

export default function ScreenProgress({ payload, onComplete }) {
  const [stage, setStage] = useState("idle");
  const [runId, setRunId] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [err, setErr] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setStage("starting");
    screen(payload, {
      onProgress: (ev) => {
        if (ev.stage === "swarm_started") { setStage("running"); setRunId(ev.run_id); }
        if (ev.stage === "worker_done") {
          setWorkers(w => [...w, { ticker: ev.ticker, score: ev.score }]);
        }
      },
      onComplete: (data) => { setStage("complete"); onComplete?.(data.candidates); },
      onError: (m) => { setStage("error"); setErr(m); },
    });
  }, [payload, onComplete]);

  const pct = workers.length > 0 && payload.universe?.length
    ? Math.min(100, Math.round((workers.length / payload.universe.length) * 100))
    : stage === "complete" ? 100 : 0;

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: C.surfaceHigh, padding: "12px 14px", fontFamily: C.mono }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textSub, marginBottom: 8 }}>
        <span>SCREEN · {payload.sector || "universe"}</span>
        <span>{runId ? `run ${runId}` : stage === "running" ? "running" : stage}</span>
      </div>

      <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: C.gold, borderRadius: 2, transition: "width .3s" }} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {(payload.universe || []).map(t => {
          const w = workers.find(x => x.ticker === t);
          const done = !!w;
          return (
            <span key={t} style={{
              fontSize: 9, padding: "2px 7px", borderRadius: 4,
              border: `1px solid ${done ? C.goldDim : C.border}`,
              color: done ? C.gold : C.textDim,
              animation: done ? "none" : "blink 1.5s infinite",
            }}>
              {t}{done ? ` ${w.score}` : ""}
            </span>
          );
        })}
      </div>

      {err && <div style={{ marginTop: 8, fontSize: 10, color: C.red }}>✗ {err}</div>}
    </div>
  );
}
