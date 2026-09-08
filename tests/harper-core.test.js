import { describe, expect, it } from "vitest";
import { BASELINE_STRATEGIES, PIPELINE_STAGES, RESEARCH_GATES, strategyToBacktestPayload, scoreExperiment } from "../src/lib/harperCore";

describe("Harper research core", () => {
  it("ships deterministic baseline strategies", () => {
    expect(BASELINE_STRATEGIES.length).toBeGreaterThanOrEqual(3);
    for (const strategy of BASELINE_STRATEGIES) {
      expect(strategy.id).toBeTruthy();
      expect(strategy.market).toBeTruthy();
      expect(strategy.hypothesis).toBeTruthy();
      expect(strategy.risk.riskPerTrade).toBeGreaterThan(0);
      expect(strategy.risk.maxTradesPerDay).toBeGreaterThan(0);
    }
  });

  it("preserves the research gate order", () => {
    expect(PIPELINE_STAGES.slice(0, 7)).toEqual([
      "Hypothesis", "Formalize", "Backtest", "Costs", "Out-of-sample", "Walk-forward", "Robustness"
    ]);
    expect(RESEARCH_GATES).toHaveLength(7);
  });

  it("produces an engine-agnostic backtest contract", () => {
    const payload = strategyToBacktestPayload(BASELINE_STRATEGIES[0]);
    expect(payload.engine).toBe("harper-research-v2");
    expect(payload.evaluation.includeCosts).toBe(true);
    expect(payload.evaluation.walkForward).toBe(true);
    expect(payload.strategy.id).toBe(BASELINE_STRATEGIES[0].id);
  });

  it("penalizes drawdown and rewards positive risk-adjusted evidence", () => {
    const strong = scoreExperiment({ trades: 1000, sharpe: 1.8, profitFactor: 1.6, winRate: 52, oosReturn: 12, maxDrawdown: 7, robustnessScore: 85 });
    const weak = scoreExperiment({ trades: 1000, sharpe: 0.5, profitFactor: 1.05, winRate: 42, oosReturn: -3, maxDrawdown: 22, robustnessScore: 20 });
    expect(strong).toBeGreaterThan(weak);
  });
});
