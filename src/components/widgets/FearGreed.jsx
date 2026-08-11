// ── FearGreed — semicircle gauge SVG from Alternative.me (PRD B2.3) ────────────
import { useEffect, useState } from "react";
import { C } from "../../lib/theme";

function classify(v) {
  if (v <= 25) return { label: "Extreme Fear", color: C.red };
  if (v <= 45) return { label: "Fear", color: "#B0B0B0" };
  if (v <= 55) return { label: "Neutral", color: C.textDim };
  if (v <= 75) return { label: "Greed", color: C.gold };
  return { label: "Extreme Greed", color: C.green };
}

function Zone({ cx, cy, r, a0, a1, color }) {
  const polar = (a) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [x0, y0] = polar(a0);
  const [x1, y1] = polar(a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return <path d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`} stroke={color} strokeWidth="14" fill="none" strokeLinecap="butt" />;
}

export default function FearGreed({ refreshInterval = 3600000 }) {
  const [val, setVal] = useState(null);
  const [prev, setPrev] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("https://api.alternative.me/fng/");
        const d = await r.json();
        if (alive && d.data?.length) {
          setVal(Number(d.data[0].value));
          setPrev(d.data[1] ? Number(d.data[1].value) : null);
          setErr(false);
        }
      } catch { if (alive) setErr(true); }
    };
    load();
    const iv = setInterval(load, refreshInterval);
    return () => { alive = false; clearInterval(iv); };
  }, [refreshInterval]);

  if (err) {
    return <WidgetBox><div style={{ color: C.red, fontFamily: C.mono, fontSize: 11 }}>Fear &amp; Greed unavailable <button onClick={() => window.location.reload()} style={{ marginLeft: 8, background: "none", border: `1px solid ${C.border}`, color: C.textDim, fontFamily: C.mono, fontSize: 9, borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}>RETRY</button></div></WidgetBox>;
  }

  const v = val ?? 50;
  const cls = classify(v);
  const needleAngle = (v / 100) * 180;

  return (
    <WidgetBox>
      <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono, letterSpacing: "0.08em", marginBottom: 4 }}>FEAR &amp; GREED</div>
      <svg viewBox="0 0 200 120" width="100%" style={{ display: "block" }}>
        {[[0, 45, "#3A3A3A"], [45, 90, "#5A5A5A"], [90, 135, "#7A7A7A"], [135, 180, "#B0B0B0"]].map(([a0, a1, c], i) => (
          <Zone key={i} cx={100} cy={105} r={70} a0={a0} a1={a1} color={c} />
        ))}
        <line x1={100} y1={105} x2={100} y2={105 - 60} stroke={cls.color} strokeWidth="3" strokeLinecap="round"
          transform={`rotate(${needleAngle - 90} 100 105)`} />
        <circle cx={100} cy={105} r={5} fill={cls.color} />
        <text x={100} y={52} textAnchor="middle" fill={C.text} fontSize="22" fontWeight="800" fontFamily={C.mono}>{v}</text>
      </svg>
      <div style={{ textAlign: "center", fontFamily: C.mono, fontSize: 11, color: cls.color, fontWeight: 700 }}>{cls.label}</div>
      {prev != null && <div style={{ textAlign: "center", fontFamily: C.mono, fontSize: 9, color: C.textDim, marginTop: 2 }}>yesterday {prev}</div>}
    </WidgetBox>
  );
}

function WidgetBox({ children }) {
  return <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>{children}</div>;
}
