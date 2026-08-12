export const HARPER_RULES = [
  "NO_TRADE is valid",
  ">=2 sources, >=1 primary",
  "R/R >= 1.5",
  "Size from invalidation",
  "No fabricated fills",
  "Intraday closes same day",
  "30 forecasts before tuning",
];

export const HARPER_MARKETS = [
  ["NYSE/NAS", "USD", "Primary"],
  ["LSE", "GBP", "Hedge"],
  ["NSE Nigeria", "NGN", "Home"],
  ["Tadawul", "SAR", "Gulf"],
  ["HKEX", "HKD", "Asia"],
];

export const HARPER_PROMPTS = [
  { label: "Thesis", text: "Build a thesis for NVDA" },
  { label: "Screen", text: "Screen semiconductors" },
  { label: "Backtest", text: "Backtest my active positions" },
  { label: "Shadow", text: "Run shadow account" },
];
