// ── BridgeStatusBar — top-bar traffic light for Bridge / engines connectivity ──
import { useEffect, useState } from "react";
import { C } from "../lib/theme";
import { bridge, bridgeConfigured } from "../lib/bridge";

const DOT = (color, pulse) => ({
  width: 8, height: 8, borderRadius: "50%", background: color,
  display: "inline-block", marginRight: 6,
  boxShadow: pulse ? `0 0 8px ${color}` : "none",
});

export default function BridgeStatusBar({ onOpen }) {
  const [health, setHealth] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!bridgeConfigured()) return;
    bridge.health().then(setHealth).catch(() => setHealth({ bridge: "unreachable" }));
  }, []);

  if (!bridgeConfigured()) return null;

  const state = health ? health.bridge : "checking";
  const ok = state === "ok";
  const label = ok ? "BRIDGE" : health ? "BRIDGE OFFLINE" : "CHECKING";

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none", border: `1px solid ${ok ? C.border : C.red}`, borderRadius: 5,
          padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center",
          fontFamily: C.mono, fontSize: 10, letterSpacing: "0.06em",
          color: ok ? C.gold : C.red,
        }}
      >
        <span style={DOT(ok ? C.green : C.red, !health)} />
        {label}
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: 30, zIndex: 50,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: "10px 12px", width: 220, fontFamily: C.mono, fontSize: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          {["bridge", "tradingagents", "vibe_trading", "supabase", "anthropic"].map(k => {
            const v = health ? health[k] : null;
            const okk = v === "ok" || v === "configured";
            return (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: C.textSub }}>
                <span>{k}</span>
                <span style={{ color: okk ? C.green : C.red }}>{v || "—"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
