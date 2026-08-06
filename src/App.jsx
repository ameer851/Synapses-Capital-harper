import { useState, useEffect, useCallback } from "react";

// ── Supabase credentials ───────────────────────────────────────────────────────
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON in Vercel env vars or .env.local.
// If left blank, the credential gate appears at startup.
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || "";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || "";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#0B0D11",
  surface: "#12151C",
  surfaceHigh: "#181C26",
  border: "#1E2232",
  borderHi: "#2A2F44",
  gold: "#C9A84C",
  goldLight: "#E2C06B",
  goldDim: "#6B5520",
  green: "#3DAD6E",
  greenDim: "#1B3D2C",
  red: "#C45252",
  redDim: "#3D1A1A",
  blue: "#4A7FC1",
  blueDim: "#1A2D48",
  text: "#E4E8F0",
  textSub: "#8490A8",
  textDim: "#424D62",
  mono: "'JetBrains Mono','Fira Mono','Courier New',monospace",
};

const fmt = {
  usd: (n) => {
    const abs = Math.abs(Number(n));
    const s = abs >= 1000
      ? abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : abs.toFixed(2);
    return (Number(n) < 0 ? "-$" : "$") + s;
  },
  pct: (n) => `${Number(n) >= 0 ? "+" : ""}${Number(n).toFixed(2)}%`,
  compact: (n) => `$${Number(n).toFixed(2)}`,
};

const clr = (n) => (Number(n) >= 0 ? C.green : C.red);

// ── Tiny components ───────────────────────────────────────────────────────────
function Badge({ label, color = C.gold }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
      color, border: `1px solid ${color}`, borderRadius: 3,
      padding: "1px 5px", fontFamily: C.mono, whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function Card({ children, style = {}, glow }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${glow ? C.goldDim : C.border}`,
      borderRadius: 8, padding: 18,
      boxShadow: glow ? "0 0 28px rgba(201,168,76,0.07)" : "none",
      ...style,
    }}>{children}</div>
  );
}

function Hdr({ title, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: C.gold, fontFamily: C.mono, textTransform: "uppercase" }}>{title}</span>
      {right && <span style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono }}>{right}</span>}
    </div>
  );
}

function KPI({ label, value, sub, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 10, color: C.textDim, letterSpacing: "0.08em", fontFamily: C.mono, textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 700, color: color || C.text, fontFamily: C.mono, letterSpacing: "-0.02em" }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: C.textSub, fontFamily: C.mono }}>{sub}</span>}
    </div>
  );
}

// ── NAV sparkline from snapshots ──────────────────────────────────────────────
function Sparkline({ data }) {
  if (!data || data.length < 2) return (
    <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "center", color: C.textDim, fontFamily: C.mono, fontSize: 11 }}>
      No snapshots yet
    </div>
  );
  const W = 300, H = 56;
  const vals = data.map((d) => Number(d.nav));
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
  const x = (i) => (i / (vals.length - 1)) * W;
  const y = (v) => H - ((v - min) / range) * (H - 4) - 2;
  const d = vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${d} L${W},${H} L0,${H} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="ng" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.gold} stopOpacity="0.22" />
          <stop offset="100%" stopColor={C.gold} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#ng)" />
      <path d={d} fill="none" stroke={C.gold} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={x(vals.length - 1)} cy={y(vals[vals.length - 1])} r="3" fill={C.gold} />
    </svg>
  );
}

// ── Credential gate ───────────────────────────────────────────────────────────
function CredentialGate({ onSave }) {
  const [url, setUrl] = useState(SUPABASE_URL);
  const [key, setKey] = useState(SUPABASE_ANON);
  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: 420 }}>
        <Card glow>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10, margin: "0 auto 12px",
              background: `linear-gradient(135deg, ${C.goldDim}, ${C.gold})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, color: C.bg, fontFamily: C.mono,
            }}>S</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Synapses Capital</div>
            <div style={{ fontSize: 12, color: C.textDim, fontFamily: C.mono, marginTop: 4 }}>Connect your Supabase project</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono, marginBottom: 6, letterSpacing: "0.08em" }}>SUPABASE PROJECT URL</div>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://xxxx.supabase.co"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 6,
                  background: C.bg, border: `1px solid ${C.borderHi}`,
                  color: C.text, fontFamily: C.mono, fontSize: 12, outline: "none",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono, marginBottom: 6, letterSpacing: "0.08em" }}>ANON KEY</div>
              <input
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1..."
                type="password"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 6,
                  background: C.bg, border: `1px solid ${C.borderHi}`,
                  color: C.text, fontFamily: C.mono, fontSize: 12, outline: "none",
                }}
              />
            </div>
            <button
              onClick={() => url && key && onSave(url.trim(), key.trim())}
              disabled={!url || !key}
              style={{
                marginTop: 4, padding: "11px", borderRadius: 6, border: "none",
                background: C.gold, color: C.bg, fontFamily: C.mono,
                fontSize: 12, fontWeight: 700, letterSpacing: "0.08em",
                cursor: url && key ? "pointer" : "not-allowed",
                opacity: url && key ? 1 : 0.4,
              }}>CONNECT</button>
          </div>

          <div style={{ marginTop: 16, padding: "10px 12px", background: C.bg, borderRadius: 6, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono, lineHeight: 1.8 }}>
              1. Create a project at supabase.com<br />
              2. Run <span style={{ color: C.gold }}>harper-schema.sql</span> in SQL Editor<br />
              3. Paste URL + anon key above<br />
              Credentials are stored in-session only.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Add position modal ────────────────────────────────────────────────────────
function AddPosition({ onClose, onSave, cash }) {
  const [form, setForm] = useState({
    ticker: "", name: "", sector: "", style: "POSITION", thesis_type: "MOMENTUM",
    shares: "", entry_price: "", target_price: "", invalidation: "",
    thesis: "", confidence: "0.70",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cost = (Number(form.shares) * Number(form.entry_price)) || 0;
  const valid = form.ticker && form.shares && form.entry_price && form.target_price && form.invalidation && cost <= cash;

  const rr = () => {
    const entry = Number(form.entry_price), target = Number(form.target_price), inv = Number(form.invalidation);
    if (!entry || !target || !inv) return null;
    const reward = target - entry, risk = entry - inv;
    if (risk <= 0) return null;
    return (reward / risk).toFixed(2);
  };

  const field = (label, key, type = "text", placeholder = "") => (
    <div>
      <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono, marginBottom: 4, letterSpacing: "0.08em" }}>{label}</div>
      <input
        value={form[key]} onChange={e => set(key, e.target.value)}
        type={type} placeholder={placeholder}
        style={{
          width: "100%", padding: "8px 10px", borderRadius: 5,
          background: C.bg, border: `1px solid ${C.borderHi}`,
          color: C.text, fontFamily: C.mono, fontSize: 12, outline: "none",
        }}
      />
    </div>
  );

  const sel = (label, key, opts) => (
    <div>
      <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono, marginBottom: 4, letterSpacing: "0.08em" }}>{label}</div>
      <select value={form[key]} onChange={e => set(key, e.target.value)}
        style={{
          width: "100%", padding: "8px 10px", borderRadius: 5,
          background: C.bg, border: `1px solid ${C.borderHi}`,
          color: C.text, fontFamily: C.mono, fontSize: 12, outline: "none",
        }}>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }}>
      <div style={{ width: 480, maxHeight: "90vh", overflowY: "auto" }}>
        <Card>
          <Hdr title="File Long Thesis" right={<span style={{ cursor: "pointer", color: C.textDim }} onClick={onClose}>✕ close</span>} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {field("TICKER", "ticker", "text", "NVDA")}
            {field("NAME", "name", "text", "NVIDIA Corp")}
            {field("SECTOR", "sector", "text", "Technology")}
            {sel("STYLE", "style", ["POSITION", "INTRADAY"])}
            {sel("TYPE", "thesis_type", ["MOMENTUM", "CATALYST", "QUALITY", "VALUE"])}
            {field("CONFIDENCE", "confidence", "number", "0.70")}
            {field("SHARES", "shares", "number", "1")}
            {field("ENTRY PRICE $", "entry_price", "number", "0.00")}
            {field("TARGET $", "target_price", "number", "0.00")}
            {field("INVALIDATION $", "invalidation", "number", "0.00")}
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono, marginBottom: 4, letterSpacing: "0.08em" }}>THESIS</div>
            <textarea
              value={form.thesis} onChange={e => set("thesis", e.target.value)}
              rows={3} placeholder="Evidence-backed variant view vs market expectation..."
              style={{
                width: "100%", padding: "8px 10px", borderRadius: 5,
                background: C.bg, border: `1px solid ${C.borderHi}`,
                color: C.text, fontFamily: C.mono, fontSize: 12, outline: "none", resize: "vertical",
              }}
            />
          </div>

          <div style={{ marginTop: 12, padding: "10px 12px", background: C.bg, borderRadius: 6, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              { label: "Cost vs cash", value: `${fmt.usd(cost)} / ${fmt.usd(cash)}`, pass: cost > 0 && cost <= cash },
              { label: "Reward / Risk", value: rr() ? `${rr()}x` : "—", pass: rr() && Number(rr()) >= 1.5 },
              { label: "Entry < Target", value: "—", pass: Number(form.entry_price) < Number(form.target_price) },
              { label: "Entry > Invalidation", value: "—", pass: Number(form.entry_price) > Number(form.invalidation) },
            ].map(c => (
              <div key={c.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: C.mono }}>
                <span style={{ color: C.textSub }}>{c.label}</span>
                <span style={{ color: c.pass ? C.green : C.red }}>{c.value !== "—" ? c.value : (c.pass ? "✓" : "✗")}</span>
              </div>
            ))}
          </div>

          <button
            disabled={!valid}
            onClick={() => valid && onSave(form)}
            style={{
              marginTop: 14, width: "100%", padding: "11px", borderRadius: 6,
              background: valid ? C.gold : C.border, color: valid ? C.bg : C.textDim,
              border: "none", fontFamily: C.mono, fontSize: 12, fontWeight: 700,
              letterSpacing: "0.08em", cursor: valid ? "pointer" : "not-allowed",
            }}>FILE THESIS → BUY</button>
        </Card>
      </div>
    </div>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [creds, setCreds] = useState(() =>
    SUPABASE_URL && SUPABASE_ANON ? { url: SUPABASE_URL, key: SUPABASE_ANON } : null
  );
  const [tab, setTab] = useState("overview");
  const [portfolio, setPortfolio] = useState(null);
  const [positions, setPositions] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selPos, setSelPos] = useState(null);

  const sbq = useCallback(async (table, opts = {}) => {
    if (!creds) return [];
    let url = `${creds.url}/rest/v1/${table}?`;
    if (opts.select) url += `select=${encodeURIComponent(opts.select)}&`;
    if (opts.filter) url += `${opts.filter}&`;
    if (opts.order)  url += `order=${opts.order}&`;
    if (opts.limit)  url += `limit=${opts.limit}&`;
    const r = await fetch(url, {
      headers: {
        apikey: creds.key, Authorization: `Bearer ${creds.key}`,
        "Content-Type": "application/json",
      },
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }, [creds]);

  const sbInsert = useCallback(async (table, body) => {
    if (!creds) throw new Error("No creds");
    const r = await fetch(`${creds.url}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: creds.key, Authorization: `Bearer ${creds.key}`,
        "Content-Type": "application/json", Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }, [creds]);

  const sbPatch = useCallback(async (table, filter, body) => {
    if (!creds) throw new Error("No creds");
    const r = await fetch(`${creds.url}/rest/v1/${table}?${filter}`, {
      method: "PATCH",
      headers: {
        apikey: creds.key, Authorization: `Bearer ${creds.key}`,
        "Content-Type": "application/json", Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }, [creds]);

  const load = useCallback(async () => {
    if (!creds) return;
    setLoading(true); setErr(null);
    try {
      const [p, pos, dec, fc, snaps, cands] = await Promise.all([
        sbq("portfolio", { limit: 1 }),
        sbq("positions", { filter: "status=neq.CLOSED", order: "opened_at.desc" }),
        sbq("decisions", { order: "decided_at.desc", limit: 20 }),
        sbq("forecasts", { order: "filed_at.desc", limit: 20 }),
        sbq("nav_snapshots", { order: "snapped_at.desc", limit: 30 }),
        sbq("candidates", { filter: `run_date=eq.${new Date().toISOString().split("T")[0]}`, order: "score.desc" }),
      ]);
      setPortfolio(p[0] || null);
      setPositions(pos || []);
      setDecisions(dec || []);
      setForecasts(fc || []);
      setSnapshots((snaps || []).reverse());
      setCandidates(cands || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [creds, sbq]);

  useEffect(() => { load(); }, [load]);

  // ── Computed metrics ────────────────────────────────────────────────────────
  const nav = portfolio
    ? Number(portfolio.cash) + positions.filter(p => p.status !== "CLOSED").reduce((s, p) => s + Number(p.shares) * Number(p.current_price || p.entry_price), 0)
    : 0;

  const navChangePct = portfolio ? ((nav - Number(portfolio.starting_cash)) / Number(portfolio.starting_cash)) * 100 : 0;

  const exposure = nav > 0
    ? (positions.filter(p => p.status !== "CLOSED").reduce((s, p) => s + Number(p.shares) * Number(p.current_price || p.entry_price), 0) / nav) * 100
    : 0;

  const resolved = forecasts.filter(f => f.outcome !== "PENDING");
  const brierScore = resolved.length > 0
    ? (resolved.reduce((s, f) => {
        const c = Number(f.confidence), o = f.outcome === "CORRECT" ? 1 : 0;
        return s + Math.pow(c - o, 2);
      }, 0) / resolved.length).toFixed(3)
    : null;

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleBuy = async (form) => {
    if (!portfolio) return;
    const cost = Number(form.shares) * Number(form.entry_price);
    try {
      const [newPos] = await sbInsert("positions", {
        ticker: form.ticker.toUpperCase(),
        name: form.name,
        sector: form.sector,
        style: form.style,
        thesis_type: form.thesis_type,
        shares: Number(form.shares),
        entry_price: Number(form.entry_price),
        current_price: Number(form.entry_price),
        target_price: Number(form.target_price),
        invalidation: Number(form.invalidation),
        thesis: form.thesis,
        confidence: Number(form.confidence),
        status: "ACTIVE",
      });
      await sbInsert("decisions", {
        action: "BUY",
        ticker: form.ticker.toUpperCase(),
        size_usd: cost,
        gate: "CLEAR",
        position_id: newPos.id,
      });
      await sbPatch("portfolio", "id=eq.synapses-capital", {
        cash: Number(portfolio.cash) - cost,
      });
      const newCash = Number(portfolio.cash) - cost;
      const newNav = newCash + positions.reduce((s, p) => s + Number(p.shares) * Number(p.current_price || p.entry_price), 0) + cost;
      await sbInsert("nav_snapshots", { nav: newNav, cash: newCash, exposure: ((newNav - newCash) / newNav) * 100 });
      setShowAdd(false);
      load();
    } catch (e) { setErr(e.message); }
  };

  const handleClose = async (pos) => {
    const proceeds = Number(pos.shares) * Number(pos.current_price || pos.entry_price);
    const pnl = proceeds - (Number(pos.shares) * Number(pos.entry_price));
    try {
      await sbPatch("positions", `id=eq.${pos.id}`, {
        status: "CLOSED", closed_at: new Date().toISOString(),
        close_price: pos.current_price, realised_pnl: pnl,
      });
      await sbInsert("decisions", {
        action: "SELL", ticker: pos.ticker, size_usd: proceeds,
        gate: pnl < 0 ? "INVALIDATED" : "THESIS_COMPLETE",
        pnl, position_id: pos.id,
      });
      await sbPatch("portfolio", "id=eq.synapses-capital", {
        cash: Number(portfolio.cash) + proceeds,
      });
      load();
    } catch (e) { setErr(e.message); }
  };

  const updatePrice = async (pos, newPrice) => {
    try {
      await sbPatch("positions", `id=eq.${pos.id}`, { current_price: Number(newPrice) });
      load();
    } catch (e) { setErr(e.message); }
  };

  if (!creds) return <CredentialGate onSave={(url, key) => setCreds({ url, key })} />;

  const TABS = ["overview","positions","research","harper"];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Inter','Helvetica Neue',sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        input::placeholder, textarea::placeholder { color: ${C.textDim}; }
        @keyframes blink { 0%,100%{opacity:.2;transform:scale(.8)} 50%{opacity:1;transform:scale(1.1)} }
        button { transition: opacity .15s, background .15s; }
      `}</style>

      <div style={{
        height: 52, background: C.surface, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", padding: "0 24px", gap: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 12 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: `linear-gradient(135deg, ${C.goldDim}, ${C.gold})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: C.bg, fontFamily: C.mono,
          }}>S</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.1 }}>Synapses Capital</div>
            <div style={{ fontSize: 9, color: C.textDim, fontFamily: C.mono }}>ADGM · USD · Virtual</div>
          </div>
        </div>

        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", fontFamily: C.mono,
            color: tab === t ? C.gold : C.textDim, textTransform: "uppercase",
            padding: "4px 0", borderBottom: `2px solid ${tab === t ? C.gold : "transparent"}`,
          }}>{t}</button>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
          {portfolio && <Badge label={portfolio.regime} color={C.green} />}
          <button onClick={load} style={{
            background: "none", border: `1px solid ${C.border}`, borderRadius: 5,
            padding: "4px 10px", fontSize: 10, color: C.textDim, fontFamily: C.mono,
            cursor: "pointer", letterSpacing: "0.06em",
          }}>{loading ? "..." : "↻ REFRESH"}</button>
        </div>
      </div>

      {err && (
        <div style={{ background: C.redDim, borderBottom: `1px solid ${C.red}`, padding: "8px 24px", fontSize: 11, color: C.red, fontFamily: C.mono }}>
          {err} — <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => setErr(null)}>dismiss</span>
        </div>
      )}

      <div style={{ padding: "20px 24px", maxWidth: 1280, margin: "0 auto" }}>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px,1fr))", gap: 14 }}>
              {[
                { label: "NAV", value: fmt.usd(nav), sub: fmt.pct(navChangePct) + " inception", color: navChangePct >= 0 ? C.green : C.red },
                { label: "Cash", value: fmt.usd(Number(portfolio?.cash || 0)), sub: `${nav > 0 ? ((Number(portfolio?.cash) / nav) * 100).toFixed(1) : 0}% of NAV` },
                { label: "Exposure", value: `${exposure.toFixed(1)}%`, sub: `${portfolio?.regime || "—"} band` },
                { label: "Positions", value: positions.length, sub: "open longs" },
                { label: "Forecasts", value: resolved.length, sub: brierScore ? `Brier ${brierScore}` : "pending" },
                { label: "Starting Cash", value: fmt.usd(Number(portfolio?.starting_cash || 100)), sub: "seed capital" },
              ].map(k => (
                <Card key={k.label}><KPI {...k} /></Card>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
              <Card>
                <Hdr title="NAV History" right={`${snapshots.length} snapshots`} />
                <Sparkline data={snapshots} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono }}>Start {fmt.usd(Number(portfolio?.starting_cash || 100))}</span>
                  <span style={{ fontSize: 10, color: navChangePct >= 0 ? C.green : C.red, fontFamily: C.mono }}>Now {fmt.usd(nav)}</span>
                </div>
              </Card>
              <Card>
                <Hdr title="Allocation" />
                {positions.length === 0 ? (
                  <div style={{ fontSize: 11, color: C.textDim, fontFamily: C.mono, textAlign: "center", paddingTop: 20 }}>No open positions — all cash</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {positions.map(p => {
                      const val = Number(p.shares) * Number(p.current_price || p.entry_price);
                      const w = nav > 0 ? (val / nav) * 100 : 0;
                      const pnlPct = ((Number(p.current_price || p.entry_price) - Number(p.entry_price)) / Number(p.entry_price)) * 100;
                      return (
                        <div key={p.id}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 11, fontFamily: C.mono, color: C.text }}>{p.ticker}</span>
                            <span style={{ fontSize: 11, fontFamily: C.mono, color: clr(pnlPct) }}>{fmt.pct(pnlPct)}</span>
                          </div>
                          <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(w, 100)}%`, height: "100%", background: pnlPct >= 0 ? C.green : C.red, borderRadius: 2 }} />
                          </div>
                        </div>
                      );
                    })}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 11, fontFamily: C.mono, color: C.textDim }}>CASH</span>
                        <span style={{ fontSize: 11, fontFamily: C.mono, color: C.textDim }}>{nav > 0 ? ((Number(portfolio?.cash) / nav) * 100).toFixed(1) : 100}%</span>
                      </div>
                      <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${nav > 0 ? (Number(portfolio?.cash) / nav) * 100 : 100}%`, height: "100%", background: C.textDim, borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <Card>
              <Hdr title="Markets Covered" right="5 adapters · redundancy enabled" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                {[
                  { name: "NYSE / NASDAQ", region: "USA", currency: "USD", role: "Primary", color: C.gold },
                  { name: "LSE", region: "UK", currency: "GBP", role: "Hedge", color: C.green },
                  { name: "NSE Nigeria", region: "NGN", currency: "NGN", role: "Home", color: C.blue },
                  { name: "Tadawul", region: "Saudi", currency: "SAR", role: "Gulf", color: C.textSub },
                  { name: "HKEX", region: "HK", currency: "HKD", role: "Asia-Pac", color: C.textSub },
                ].map(m => (
                  <div key={m.name} style={{ padding: "10px 12px", background: C.bg, borderRadius: 6, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: m.color, fontFamily: C.mono }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono, marginTop: 3 }}>{m.currency} · {m.role}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <Hdr title="Decision Log" right={`${decisions.length} total`} />
              {decisions.length === 0 ? (
                <div style={{ fontSize: 11, color: C.textDim, fontFamily: C.mono, textAlign: "center", padding: "20px 0" }}>No decisions yet. File a thesis to begin.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {decisions.slice(0, 8).map(d => (
                    <div key={d.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", background: C.bg, borderRadius: 5, border: `1px solid ${C.border}` }}>
                      <span style={{
                        minWidth: 60, fontSize: 10, fontWeight: 700, fontFamily: C.mono, letterSpacing: "0.06em",
                        color: d.action === "BUY" ? C.green : d.action === "SELL" ? C.red : C.textDim,
                      }}>{d.action}</span>
                      <span style={{ flex: 1, fontSize: 12, fontFamily: C.mono, color: C.text }}>{d.ticker}
                        {d.size_usd && <span style={{ color: C.textSub }}> · {fmt.usd(d.size_usd)}</span>}
                        {d.pnl != null && <span style={{ color: clr(d.pnl) }}> · {fmt.usd(d.pnl)}</span>}
                        {d.reason && <span style={{ color: C.textDim }}> — {d.reason}</span>}
                      </span>
                      <span style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono, whiteSpace: "nowrap" }}>
                        {new Date(d.decided_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── POSITIONS ────────────────────────────────────────────────────── */}
        {tab === "positions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 11, color: C.textSub, fontFamily: C.mono }}>
                Cash available: <span style={{ color: C.gold }}>{fmt.usd(Number(portfolio?.cash || 0))}</span>
              </div>
              <button onClick={() => setShowAdd(true)} style={{
                padding: "8px 16px", borderRadius: 6, border: "none",
                background: C.gold, color: C.bg, fontFamily: C.mono,
                fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer",
              }}>+ FILE THESIS</button>
            </div>

            {positions.length === 0 ? (
              <Card>
                <div style={{ textAlign: "center", padding: "40px 0", color: C.textDim, fontFamily: C.mono, fontSize: 12 }}>
                  No open positions. Cash is 100% deployed in reserve.<br />
                  <span style={{ color: C.textDim, fontSize: 10 }}>File a thesis to open a long position.</span>
                </div>
              </Card>
            ) : (
              <Card>
                <Hdr title="Open Positions" right={`${positions.length} longs`} />
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                        {["Ticker","Style","Type","Entry","Current","P&L","Thesis","Status","Actions"].map(h => (
                          <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: C.textDim, fontFamily: C.mono, fontWeight: 600, fontSize: 9, letterSpacing: "0.08em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map(p => {
                        const pnlPct = ((Number(p.current_price || p.entry_price) - Number(p.entry_price)) / Number(p.entry_price)) * 100;
                        const pnlAbs = (Number(p.current_price || p.entry_price) - Number(p.entry_price)) * Number(p.shares);
                        return (
                          <>
                            <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: selPos === p.id ? C.surfaceHigh : "transparent" }}
                              onClick={() => setSelPos(selPos === p.id ? null : p.id)}>
                              <td style={{ padding: "10px 8px", fontFamily: C.mono, fontWeight: 700, color: C.text }}>{p.ticker}</td>
                              <td style={{ padding: "10px 8px" }}><Badge label={p.style} color={p.style === "INTRADAY" ? C.blue : C.gold} /></td>
                              <td style={{ padding: "10px 8px" }}><Badge label={p.thesis_type} color={C.textSub} /></td>
                              <td style={{ padding: "10px 8px", fontFamily: C.mono, color: C.textSub }}>{fmt.usd(Number(p.entry_price))}</td>
                              <td style={{ padding: "10px 8px" }}>
                                <input
                                  type="number"
                                  defaultValue={Number(p.current_price || p.entry_price)}
                                  onClick={e => e.stopPropagation()}
                                  onBlur={e => updatePrice(p, e.target.value)}
                                  style={{
                                    width: 70, padding: "3px 6px", borderRadius: 4, border: `1px solid ${C.borderHi}`,
                                    background: C.bg, color: C.text, fontFamily: C.mono, fontSize: 11, outline: "none",
                                  }}
                                />
                              </td>
                              <td style={{ padding: "10px 8px", fontFamily: C.mono, color: clr(pnlPct) }}>
                                {fmt.pct(pnlPct)}<br />
                                <span style={{ fontSize: 9, color: clr(pnlAbs) }}>{fmt.usd(pnlAbs)}</span>
                              </td>
                              <td style={{ padding: "10px 8px", maxWidth: 160, color: C.textSub, fontSize: 10 }}>
                                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{p.thesis || "—"}</div>
                              </td>
                              <td style={{ padding: "10px 8px" }}>
                                <Badge label={p.status} color={p.status === "ACTIVE" ? C.green : p.status === "PENDING_RESOLUTION" ? C.blue : C.red} />
                              </td>
                              <td style={{ padding: "10px 8px" }}>
                                <button onClick={e => { e.stopPropagation(); handleClose(p); }} style={{
                                  padding: "4px 8px", borderRadius: 4, border: `1px solid ${C.red}`,
                                  background: "none", color: C.red, fontFamily: C.mono, fontSize: 9,
                                  cursor: "pointer", letterSpacing: "0.06em",
                                }}>CLOSE</button>
                              </td>
                            </tr>
                            {selPos === p.id && (
                              <tr key={`${p.id}-d`} style={{ background: C.surfaceHigh }}>
                                <td colSpan={9} style={{ padding: "10px 14px", fontSize: 11, fontFamily: C.mono, color: C.textSub, lineHeight: 1.8 }}>
                                  <span style={{ color: C.gold }}>Target: </span>{fmt.usd(Number(p.target_price || 0))} &nbsp;|&nbsp;
                                  <span style={{ color: C.gold }}>Invalidation: </span>{fmt.usd(Number(p.invalidation || 0))} &nbsp;|&nbsp;
                                  <span style={{ color: C.gold }}>Confidence: </span>{p.confidence ? `${(Number(p.confidence) * 100).toFixed(0)}%` : "—"}&nbsp;|&nbsp;
                                  <span style={{ color: C.gold }}>Opened: </span>{new Date(p.opened_at).toLocaleDateString()}
                                  {p.thesis && <><br /><span style={{ color: C.gold }}>Thesis: </span>{p.thesis}</>}
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            <div style={{ padding: "12px 16px", background: C.surface, borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 11, color: C.textDim, fontFamily: C.mono, lineHeight: 1.9 }}>
              <span style={{ color: C.gold }}>Risk gates: </span>Max 20% NAV per position · Long-only · No leverage · No shorts · Intraday must close same day · R/R ≥ 1.5 required
            </div>
          </div>
        )}

        {/* ── RESEARCH ─────────────────────────────────────────────────────── */}
        {tab === "research" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <Hdr title="Forecast Tracker" right={brierScore ? `Brier ${brierScore} · n=${resolved.length}` : `n=${resolved.length} — pending`} />
              {forecasts.length === 0 ? (
                <div style={{ fontSize: 11, color: C.textDim, fontFamily: C.mono, textAlign: "center", padding: "20px 0" }}>No forecasts filed yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {forecasts.map(f => {
                    const ic = f.outcome === "CORRECT" ? "✓" : f.outcome === "WRONG" ? "✗" : "◌";
                    const cc = f.outcome === "CORRECT" ? C.green : f.outcome === "WRONG" ? C.red : C.blue;
                    return (
                      <div key={f.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "9px 10px", background: C.bg, borderRadius: 5, border: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 14, color: cc, minWidth: 18, textAlign: "center" }}>{ic}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: C.text, fontFamily: C.mono }}>{f.event}</div>
                          <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono }}>Filed {new Date(f.filed_at).toLocaleDateString()}{f.resolved_at ? ` · Resolved ${new Date(f.resolved_at).toLocaleDateString()}` : ""}</div>
                        </div>
                        <span style={{ fontSize: 11, color: C.textSub, fontFamily: C.mono }}>{(Number(f.confidence) * 100).toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ marginTop: 12, padding: "9px 12px", background: C.bg, borderRadius: 5, border: `1px solid ${C.border}`, fontSize: 10, color: C.textDim, fontFamily: C.mono }}>
                Brier skill unlocks at 30 resolved forecasts (min sample). Score &lt;0.25 = better than chance.
              </div>
            </Card>

            <Card>
              <Hdr title="Today's Screen" right={`${candidates.length} candidates`} />
              {candidates.length === 0 ? (
                <div style={{ fontSize: 11, color: C.textDim, fontFamily: C.mono, textAlign: "center", padding: "20px 0" }}>Ask Harper to screen a sector or add candidates manually.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {candidates.map(c => (
                    <div key={c.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "9px 10px", background: C.bg, borderRadius: 5, border: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: C.mono, color: C.text, minWidth: 44 }}>{c.ticker}</span>
                      <div style={{ flex: 1, fontSize: 11, color: C.textSub, fontFamily: C.mono }}>{c.gate || "—"}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {c.depth && <Badge label={c.depth} color={C.textDim} />}
                        {c.verdict && <Badge label={c.verdict} color={c.verdict === "QUALIFIED" ? C.green : c.verdict === "PENDING" ? C.blue : C.red} />}
                        {c.score != null && <span style={{ fontSize: 10, fontFamily: C.mono, color: C.textDim }}>{c.score}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── HARPER ───────────────────────────────────────────────────────── */}
        {tab === "harper" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, alignItems: "start" }}>
            <Card glow style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.goldDim}, ${C.gold})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 800, color: C.bg, fontFamily: C.mono,
                }}>H</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Harper</div>
                  <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono }}>Virtual CIO · Synapses Capital</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <Badge label="TELEGRAM" color={C.green} />
                </div>
              </div>

              <div style={{ fontSize: 12, color: C.textSub, fontFamily: C.mono, lineHeight: 1.9 }}>
                Harper lives in <span style={{ color: C.gold }}>Telegram</span>. Talk to her there — theses,
                screening, regime calls, and trades flow through her. The dashboard mirrors what
                she decides.
              </div>

              <div style={{ padding: "12px 14px", background: C.bg, borderRadius: 6, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono, marginBottom: 8, letterSpacing: "0.08em" }}>OPEN TELEGRAM</div>
                <a href="https://t.me/synaco_synapses_bot" target="_blank" rel="noreferrer" style={{
                  display: "block", textAlign: "center", padding: "11px", borderRadius: 6,
                  background: C.gold, color: C.bg, fontFamily: C.mono,
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textDecoration: "none",
                }}>TALK TO HARPER →</a>
              </div>

              <div>
                <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono, marginBottom: 8, letterSpacing: "0.08em" }}>WHAT SHE HANDLES</div>
                {[
                  ["Theses", "Long-only, R/R ≥ 1.5, 2+ sources"],
                  ["Screening", "5 markets, daily candidates"],
                  ["Regime", "Exposure band per regime"],
                  ["Trades", "Files positions to this dashboard"],
                  ["Forecasts", "Brier-scored calibration"],
                ].map(([n, d]) => (
                  <div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}`, fontSize: 11, fontFamily: C.mono }}>
                    <span style={{ color: C.text }}>{n}</span>
                    <span style={{ color: C.textDim }}>{d}</span>
                  </div>
                ))}
              </div>
            </Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Card>
                <Hdr title="Rules" />
                <div style={{ fontSize: 10, color: C.textSub, fontFamily: C.mono, lineHeight: 2.1 }}>
                  {["NO_TRADE is valid","≥2 sources, ≥1 primary","R/R ≥ 1.5","Size from invalidation","No fabricated fills","Intraday closes same day","30 forecasts before tuning"].map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 8 }}>
                      <span style={{ color: C.goldDim }}>{String(i + 1).padStart(2, "0")}</span>{r}
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <Hdr title="Markets" />
                <div style={{ fontSize: 10, color: C.textSub, fontFamily: C.mono, lineHeight: 2 }}>
                  {[["NYSE/NAS","USD · Primary"],["LSE","GBP · Hedge"],["NSE Nigeria","NGN · Home"],["Tadawul","SAR · Gulf"],["HKEX","HKD · Asia"]].map(([n, d]) => (
                    <div key={n} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: C.text }}>{n}</span>
                      <span style={{ color: C.textDim }}>{d}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <Hdr title="Regime" />
                <div style={{ fontSize: 11, fontFamily: C.mono, color: C.textSub, lineHeight: 2 }}>
                  <span style={{ color: C.green }}>{portfolio?.regime || "NORMAL"}</span><br />
                  <span style={{ color: C.textDim, fontSize: 10 }}>
                    DEFENSIVE 25–50%<br />
                    NORMAL 50–75%<br />
                    STRONG 70–90%<br />
                    Exposure: {exposure.toFixed(1)}%
                  </span>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {showAdd && portfolio && (
        <AddPosition cash={Number(portfolio.cash)} onClose={() => setShowAdd(false)} onSave={handleBuy} />
      )}
    </div>
  );
}
