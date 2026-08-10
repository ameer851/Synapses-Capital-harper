// ── Shared monochrome design tokens for Bridge components ─────────────────────
// Mirrors the C token object in App.jsx so new components match the dashboard.

export const C = {
  bg: "#0A0A0A",
  surface: "#131313",
  surfaceHigh: "#1C1C1C",
  border: "#262626",
  borderHi: "#3A3A3A",
  gold: "#E6E6E6",
  goldLight: "#FFFFFF",
  goldDim: "#4D4D4D",
  green: "#FFFFFF",
  greenDim: "#3A3A3A",
  red: "#7A7A7A",
  redDim: "#222222",
  blue: "#A0A0A0",
  blueDim: "#2E2E2E",
  text: "#F2F2F2",
  textSub: "#A6A6A6",
  textDim: "#5A5A5A",
  mono: "'JetBrains Mono','Fira Mono','Courier New',monospace",
};

export const fmt = {
  usd: (n) => {
    const abs = Math.abs(Number(n));
    const s = abs >= 1000
      ? abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : abs.toFixed(2);
    return (Number(n) < 0 ? "-$" : "$") + s;
  },
  pct: (n) => `${Number(n) >= 0 ? "+" : ""}${Number(n).toFixed(2)}%`,
  num: (n, d = 2) => Number(n).toFixed(d),
};
