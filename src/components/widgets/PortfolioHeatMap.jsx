// ── PortfolioHeatMap — squarified treemap of positions (PRD B2.8) ─────────────
import { useState } from "react";
import { C } from "../../lib/theme";
import { squarify } from "../../lib/squarify";

function pnlColor(pct) {
  if (pct > 5) return "#D0D0D0";
  if (pct >= 0) return "#9A9A9A";
  if (pct >= -5) return "#555555";
  return "#2E2E2E";
}

function pnlTextColor(pct) {
  return pct >= 0 ? "#0A0A0A" : "#F2F2F2";
}

export default function PortfolioHeatMap({ positions, nav, cash }) {
  const [hover, setHover] = useState(null);
  if (!positions || positions.length < 2) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 180, color: C.textDim, fontFamily: C.mono, fontSize: 11, border: `1px dashed ${C.border}`, borderRadius: 8 }}>
        Add positions to see heat map
      </div>
    );
  }

  const W = 480, H = 260;
  const cells = positions.map((p) => {
    const val = Number(p.shares) * Number(p.current_price || p.entry_price);
    const pct = ((Number(p.current_price || p.entry_price) - Number(p.entry_price)) / Number(p.entry_price)) * 100;
    return { label: p.ticker, value: val, pct, name: p.name, shares: p.shares, entry: p.entry_price, current: p.current_price || p.entry_price, sector: p.sector };
  });
  if (Number(cash) > 0) cells.push({ label: "CASH", value: Number(cash), pct: 0, name: "Cash", sector: "Cash" });

  const rects = squarify(cells, { x: 0, y: 0, w: W, h: H });

  return (
    <div style={{ position: "relative" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", background: C.bg }}>
        {rects.map((r, i) => {
          const isCash = r.label === "CASH";
          const bg = isCash ? C.textDim : pnlColor(r.pct);
          const tc = isCash ? "#0A0A0A" : pnlTextColor(r.pct);
          const showLabel = r.w > 40 && r.h > 24;
          return (
            <g key={i} onMouseEnter={() => setHover(r)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={bg} stroke={C.bg} strokeWidth={1.5} rx={2} />
              {showLabel && (
                <>
                  <text x={r.x + 6} y={r.y + 16} fill={tc} fontSize="11" fontWeight="700" fontFamily={C.mono}>{r.label}</text>
                  <text x={r.x + 6} y={r.y + 30} fill={tc} fontSize="10" fontFamily={C.mono} opacity="0.9">
                    {isCash ? "—" : `${r.pct >= 0 ? "+" : ""}${r.pct.toFixed(1)}%`}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      {hover && (
        <div style={{
          position: "absolute", left: 12, bottom: 12, background: C.surfaceHigh,
          border: `1px solid ${C.borderHi}`, borderRadius: 6, padding: "8px 12px",
          fontFamily: C.mono, fontSize: 10, color: C.textSub, lineHeight: 1.8,
        }}>
          <div style={{ color: C.gold, fontWeight: 700 }}>{hover.name || hover.label}</div>
          {hover.sector && <div>{hover.sector}</div>}
          <div>Weight {nav > 0 ? ((hover.value / nav) * 100).toFixed(1) : 0}%</div>
          {hover.label !== "CASH" && (
            <>
              <div>P&L {hover.pct >= 0 ? "+" : ""}{hover.pct.toFixed(2)}% · ${((hover.current - hover.entry) * hover.shares).toFixed(2)}</div>
              <div>@ {hover.current}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
