import { useMemo, useState } from "react";
import { bridge, bridgeConfigured, backtest } from "./lib/bridge";
import {
  BASELINE_STRATEGIES,
  HARPER_VERSION,
  PIPELINE_STAGES,
  RESEARCH_GATES,
  MARKETS,
  strategyToBacktestPayload,
  scoreExperiment,
} from "./lib/harperCore";

const demoExperiments = [
  { id: "EXP-024", strategy: "15m ORB + 1m FVG Breakout", market: "MNQ", status: "PASSED", trades: 1842, sharpe: 1.72, pf: 1.48, dd: 8.4, oos: 11.8, score: 61.4 },
  { id: "EXP-023", strategy: "Opening Range Break + Retest", market: "MNQ", status: "REVIEW", trades: 1631, sharpe: 1.28, pf: 1.29, dd: 10.9, oos: 6.1, score: 43.2 },
  { id: "EXP-022", strategy: "Opening Range Liquidity Sweep", market: "MNQ", status: "FAILED", trades: 1710, sharpe: 0.74, pf: 1.08, dd: 17.6, oos: -3.7, score: 9.5 },
];

const riskChecks = [
  ["Risk / trade", "0.25%", "PASS"],
  ["Max positions", "1", "PASS"],
  ["Target", "≥ 1.5R", "PASS"],
  ["Overnight exposure", "0", "PASS"],
  ["Major-news gate", "ON", "PASS"],
];

function Stat({ label, value, sub }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</div>;
}

function Pill({ children, tone = "neutral" }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function Panel({ title, meta, children, className = "" }) {
  return <section className={`panel ${className}`}><div className="panel-head"><div><span className="eyebrow">{title}</span></div>{meta && <span className="panel-meta">{meta}</span>}</div>{children}</section>;
}

function App() {
  const [tab, setTab] = useState("overview");
  const [strategies, setStrategies] = useState(BASELINE_STRATEGIES);
  const [selected, setSelected] = useState(BASELINE_STRATEGIES[0]);
  const [experiments, setExperiments] = useState(demoExperiments);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("Research environment ready.");
  const [query, setQuery] = useState("");

  const filteredStrategies = useMemo(() => strategies.filter(s => `${s.name} ${s.market} ${s.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [strategies, query]);

  async function runBacktest() {
    setRunning(true);
    setMessage("Compiling strategy → applying costs → running out-of-sample and robustness gates…");
    try {
      if (bridgeConfigured()) {
        await new Promise((resolve, reject) => backtest(strategyToBacktestPayload(selected), {
          onProgress: p => setMessage(p?.message || `Backtest progress ${p?.progress ?? ""}`),
          onComplete: result => {
            const metrics = result?.metrics || result || {};
            const exp = { id: `EXP-${String(Date.now()).slice(-3)}`, strategy: selected.name, market: selected.market, status: "REVIEW", trades: metrics.trades || 0, sharpe: metrics.sharpe || 0, pf: metrics.profitFactor || 0, dd: Math.abs(metrics.maxDrawdown || 0), oos: metrics.oosReturn || metrics.return || 0, score: scoreExperiment(metrics) };
            setExperiments(prev => [exp, ...prev]);
            setMessage("Backtest complete. Review the gate results before promotion.");
            resolve();
          }, onError: err => reject(new Error(err)),
        }));
      } else {
        await new Promise(r => setTimeout(r, 900));
        const exp = { id: `EXP-${String(Date.now()).slice(-3)}`, strategy: selected.name, market: selected.market, status: "SIMULATED", trades: 1500, sharpe: 1.11, pf: 1.22, dd: 12.6, oos: 4.9, score: 33.7 };
        setExperiments(prev => [exp, ...prev]);
        setMessage("Bridge not configured — simulated run created so the workflow can be tested end-to-end.");
      }
    } catch (e) {
      setMessage(`Backtest failed: ${e.message}`);
    } finally {
      setRunning(false);
    }
  }

  function newStrategy() {
    const next = { ...strategies[0], id: `STRAT-${Date.now()}`, name: "New research hypothesis", hypothesis: "Define the measurable market behavior this strategy attempts to exploit.", lifecycle: "draft", tags: ["new"] };
    setStrategies(prev => [next, ...prev]);
    setSelected(next);
    setTab("strategies");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark">H</div><div><strong>HARPER</strong><span>SYnapseS Capital · Research OS</span></div></div>
        <div className="top-status"><Pill tone={bridgeConfigured() ? "good" : "warn"}>{bridgeConfigured() ? "BRIDGE ONLINE" : "LOCAL MODE"}</Pill><span className="mono">v{HARPER_VERSION}</span><button className="ghost" onClick={() => setMessage("No live orders. Research-only mode is enforced.")}>RESEARCH ONLY</button></div>
      </header>

      <aside className="sidebar">
        <button className={tab === "overview" ? "nav active" : "nav"} onClick={() => setTab("overview")}>Overview</button>
        <button className={tab === "strategies" ? "nav active" : "nav"} onClick={() => setTab("strategies")}>Strategy Lab</button>
        <button className={tab === "experiments" ? "nav active" : "nav"} onClick={() => setTab("experiments")}>Experiments</button>
        <button className={tab === "gates" ? "nav active" : "nav"} onClick={() => setTab("gates")}>Validation Gates</button>
        <button className={tab === "risk" ? "nav active" : "nav"} onClick={() => setTab("risk")}>Risk Engine</button>
        <button className={tab === "monitor" ? "nav active" : "nav"} onClick={() => setTab("monitor")}>Market Monitor</button>
        <div className="sidebar-bottom"><button className="nav" onClick={() => setMessage("Harper AI should orchestrate research, never override hard risk gates.")}>Harper AI</button><span className="sidebar-label">SYSTEM</span></div>
      </aside>

      <main className="main">
        <div className="page-title"><div><div className="breadcrumb">SYNAPSES CAPITAL / HARPER</div><h1>{tab === "overview" ? "Research Command" : tab === "strategies" ? "Strategy Lab" : tab === "experiments" ? "Experiments" : tab === "gates" ? "Validation Gates" : tab === "risk" ? "Risk Engine" : "Market Monitor"}</h1><p>{message}</p></div><button className="primary" onClick={newStrategy}>+ New Hypothesis</button></div>

        {tab === "overview" && <>
          <div className="stat-grid"><Stat label="Active hypotheses" value={strategies.length} sub="3 baselines seeded"/><Stat label="Experiments" value={experiments.length} sub="last run today"/><Stat label="Best OOS return" value="+11.8%" sub="ORB-FVG baseline"/><Stat label="Deployment candidates" value="0" sub="no strategy has passed all gates"/></div>
          <div className="two-col"><Panel title="Research pipeline" meta="strict progression"><div className="pipeline">{PIPELINE_STAGES.map((s, i) => <div key={s} className={`stage ${i < 3 ? "done" : ""}`}><span>{String(i + 1).padStart(2, "0")}</span><b>{s}</b></div>)}</div></Panel><Panel title="Decision rule" meta="Harper principle"><div className="decision"><div className="decision-mark">!</div><div><h3>Falsify before you optimize</h3><p>Reddit, GitHub and discretionary ideas are hypotheses — not evidence. Harper independently reproduces them, adds realistic costs, then attacks them with out-of-sample and robustness tests.</p></div></div></Panel></div>
          <Panel title="Research queue" meta={`${strategies.length} hypotheses`}><div className="table-head"><span>Strategy</span><span>Market</span><span>Lifecycle</span><span>Evidence</span><span></span></div>{strategies.map(s => <button className="table-row" key={s.id} onClick={() => { setSelected(s); setTab("strategies"); }}><span><b>{s.name}</b><small>{s.id}</small></span><span className="mono">{s.market}</span><span><Pill tone={s.lifecycle === "baseline" ? "info" : "neutral"}>{s.lifecycle}</Pill></span><span className="mono">{s.tags.slice(0, 2).join(" · ")}</span><span>→</span></button>)}</Panel>
        </>}

        {tab === "strategies" && <div className="workspace"><Panel title="Hypotheses" meta="deterministic candidates"><div className="toolbar"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search strategies…"/><button className="secondary" onClick={() => setStrategies(BASELINE_STRATEGIES)}>Reset baselines</button></div>{filteredStrategies.map(s => <button className={`strategy-item ${selected.id === s.id ? "selected" : ""}`} key={s.id} onClick={() => setSelected(s)}><div><b>{s.name}</b><small>{s.market} · {s.timeframe} · {s.lifecycle}</small></div><Pill>{s.tags[0]}</Pill></button>)}</Panel><Panel title="Strategy specification" meta={selected.id}><div className="spec-header"><div><h2>{selected.name}</h2><p>{selected.hypothesis}</p></div><Pill tone="info">{selected.market}</Pill></div><div className="spec-grid"><div><span>OPENING RANGE</span><strong>{selected.openingRange?.start || "—"} → {selected.openingRange?.end || "—"} ET</strong></div><div><span>ENTRY</span><strong>{selected.entry.direction} / {selected.entry.trigger}</strong></div><div><span>STOP</span><strong>{selected.risk.stop}</strong></div><div><span>TARGET</span><strong>{selected.risk.targetR}R</strong></div><div><span>RISK / TRADE</span><strong>{selected.risk.riskPerTrade}%</strong></div><div><span>MAX TRADES</span><strong>{selected.risk.maxTradesPerDay}/day</strong></div></div><div className="rule-box"><span>HARPER INTERPRETATION</span><pre>{JSON.stringify(strategyToBacktestPayload(selected), null, 2)}</pre></div><button className="primary wide" disabled={running} onClick={runBacktest}>{running ? "Running research pipeline…" : "Run full backtest"}</button></Panel></div>}

        {tab === "experiments" && <Panel title="Experiment ledger" meta="immutable results"><div className="table-head exp"><span>ID</span><span>Strategy</span><span>Trades</span><span>Sharpe</span><span>PF</span><span>Max DD</span><span>OOS</span><span>Score</span></div>{experiments.map(e => <div className="table-row exp" key={e.id}><span className="mono">{e.id}</span><span><b>{e.strategy}</b><small>{e.market} · <Pill tone={e.status === "PASSED" ? "good" : e.status === "FAILED" ? "bad" : "warn"}>{e.status}</Pill></small></span><span>{e.trades}</span><span>{e.sharpe}</span><span>{e.pf}</span><span>{e.dd}%</span><span>{e.oos}%</span><strong>{e.score}</strong></div>)}</Panel>}

        {tab === "gates" && <div className="gate-grid">{RESEARCH_GATES.map((g, i) => <Panel key={g.id} title={`Gate ${i + 1}`} meta={g.id.toUpperCase()}><div className="gate-card"><div className="gate-state">{i < 2 ? "✓" : "○"}</div><div><h3>{g.label}</h3><p>{g.description}</p></div></div><Pill tone={i < 2 ? "good" : "neutral"}>{i < 2 ? "READY" : "PENDING"}</Pill></Panel>)}</div>}

        {tab === "risk" && <div className="two-col"><Panel title="Hard risk constraints" meta="cannot be overridden by AI"><div className="risk-list">{riskChecks.map(([a,b,c]) => <div className="risk-row" key={a}><span>{a}</span><b className="mono">{b}</b><Pill tone="good">{c}</Pill></div>)}</div></Panel><Panel title="Promotion rule" meta="strategy → paper"><div className="decision large"><div className="decision-mark">R</div><div><h3>No deployment on backtest alone</h3><p>A strategy must clear deterministic specification, realistic costs, untouched OOS, walk-forward stability, robustness and paper-trading reconciliation before Harper can recommend promotion.</p></div></div></Panel></div>}

        {tab === "monitor" && <div className="two-col"><Panel title="US cash session" meta="America/New_York"><div className="market-grid"><Stat label="MNQ" value="WAIT" sub="opening range not formed"/><Stat label="OR window" value="09:30–09:45" sub="ET"/><Stat label="Liquidity" value="UNAVAILABLE" sub="connect market data"/><Stat label="News risk" value="CHECK" sub="calendar gate required"/></div></Panel><Panel title="No-trade doctrine" meta="live monitor"><div className="empty-state"><div>◎</div><h3>Observation is a valid state.</h3><p>Harper does not manufacture signals. No setup is better than an unvalidated setup.</p></div></Panel></div>}
      </main>

      <footer className="footer"><span>HARPER · research-first architecture</span><span className="mono">{bridgeConfigured() ? "bridge://connected" : "bridge://not-configured"}</span></footer>
    </div>
  );
}

export default App;
