export const HARPER_VERSION = "2.0.0";

export const MARKETS = [
  { id: "MNQ", name: "Micro E-mini Nasdaq-100", venue: "CME", assetClass: "Futures", tickSize: 0.25, tickValue: 0.5 },
  { id: "NQ", name: "E-mini Nasdaq-100", venue: "CME", assetClass: "Futures", tickSize: 0.25, tickValue: 5 },
  { id: "ES", name: "E-mini S&P 500", venue: "CME", assetClass: "Futures", tickSize: 0.25, tickValue: 12.5 },
];

export const PIPELINE_STAGES = [
  "Hypothesis",
  "Formalize",
  "Backtest",
  "Costs",
  "Out-of-sample",
  "Walk-forward",
  "Robustness",
  "Paper",
  "Deploy",
];

export const RESEARCH_GATES = [
  { id: "spec", label: "Deterministic specification", description: "Every rule can be expressed as code without discretionary wording." },
  { id: "data", label: "Data integrity", description: "Session, timezone, corporate actions, contract rolls and missing bars are controlled." },
  { id: "costs", label: "Realistic costs", description: "Fees, spread, slippage and execution assumptions are included." },
  { id: "oos", label: "Out-of-sample", description: "A completely untouched evaluation period exists before selection." },
  { id: "robust", label: "Robustness", description: "Results survive parameter perturbation and adverse execution assumptions." },
  { id: "monte", label: "Monte Carlo", description: "Trade-order and return-path uncertainty are stress tested." },
  { id: "paper", label: "Paper validation", description: "Live market behavior matches the backtest within an approved tolerance." },
];

export function emptyStrategy() {
  return {
    id: `STRAT-${Date.now()}`,
    name: "Untitled Strategy",
    market: "MNQ",
    timeframe: "1m",
    session: "US_RTH",
    hypothesis: "",
    entry: { direction: "breakout", trigger: "close", confirmation: ["fvg"] },
    risk: { riskPerTrade: 0.25, stop: "structure", targetR: 2, maxTradesPerDay: 1 },
    filters: [],
    lifecycle: "draft",
    tags: [],
  };
}

export function redditOrbFvg() {
  return {
    id: "ORB-FVG-01",
    name: "15m ORB + 1m FVG Breakout",
    market: "MNQ",
    timeframe: "1m",
    session: "US_RTH",
    hypothesis: "The first sustained break of the US cash opening range, confirmed by displacement/imbalance, has positive short-horizon expectancy.",
    openingRange: { start: "09:30", end: "09:45", timezone: "America/New_York" },
    entry: { direction: "breakout", trigger: "close", confirmation: ["fvg"] },
    risk: { riskPerTrade: 0.25, stop: "fvg_extreme", targetR: 2, maxTradesPerDay: 1 },
    filters: ["one_directional_attempt_per_day"],
    lifecycle: "baseline",
    tags: ["ORB", "FVG", "NQ", "intraday"],
  };
}

export const BASELINE_STRATEGIES = [
  redditOrbFvg(),
  {
    id: "ORB-SWEEP-01",
    name: "Opening Range Liquidity Sweep",
    market: "MNQ",
    timeframe: "1m",
    session: "US_RTH",
    hypothesis: "False breaks of the opening range followed by a reclaim may outperform continuation entries in mean-reverting conditions.",
    openingRange: { start: "09:30", end: "09:45", timezone: "America/New_York" },
    entry: { direction: "reversal", trigger: "reclaim", confirmation: ["liquidity_sweep"] },
    risk: { riskPerTrade: 0.25, stop: "sweep_extreme", targetR: 2, maxTradesPerDay: 1 },
    filters: ["one_trade_per_day"],
    lifecycle: "baseline",
    tags: ["ORB", "CRT", "reversal"],
  },
  {
    id: "ORB-RETEST-01",
    name: "Opening Range Break + Retest",
    market: "MNQ",
    timeframe: "1m",
    session: "US_RTH",
    hypothesis: "Continuation after a confirmed opening-range break and retest may reduce false-break exposure.",
    openingRange: { start: "09:30", end: "09:45", timezone: "America/New_York" },
    entry: { direction: "breakout", trigger: "retest", confirmation: ["close_back_above_orh_or_below_orl"] },
    risk: { riskPerTrade: 0.25, stop: "retest_structure", targetR: 2, maxTradesPerDay: 1 },
    filters: [],
    lifecycle: "baseline",
    tags: ["ORB", "retest", "continuation"],
  },
];

export function strategyToBacktestPayload(strategy, overrides = {}) {
  return {
    engine: "harper-research-v2",
    strategy,
    evaluation: {
      includeCosts: true,
      slippageModel: "conservative",
      split: "train-validation-out-of-sample",
      walkForward: true,
      monteCarlo: true,
      ...overrides,
    },
  };
}

export function scoreExperiment(metrics = {}) {
  const sample = Number(metrics.trades || 0);
  const oos = Number(metrics.oosReturn ?? metrics.return ?? 0);
  const drawdown = Math.abs(Number(metrics.maxDrawdown || 0));
  const sharpe = Number(metrics.sharpe || 0);
  const profitFactor = Number(metrics.profitFactor || 0);
  const winRate = Number(metrics.winRate || 0);
  if (!sample) return 0;
  const robustness = Number(metrics.robustnessScore || 0);
  const score = (sharpe * 20) + (Math.min(profitFactor, 3) * 10) + (Math.min(winRate, 100) * 0.1) + (Math.max(oos, -50) * 0.25) + (robustness * 0.25) - (drawdown * 0.3);
  return Math.round(score * 10) / 10;
}
