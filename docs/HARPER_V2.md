# Harper v2 — Research Operating System

## Mission
Harper is the research operating system for Synapses Capital. Its job is to turn trading hypotheses into reproducible evidence, not to manufacture live signals.

The core loop is:

**Hypothesis → Formalize → Backtest → Costs → Out-of-sample → Walk-forward → Robustness → Paper → Candidate**

A strategy cannot skip a gate because a backtest looks attractive.

## What changed

The original Harper UI was a portfolio/dashboard surface with a thin Bridge client. Harper v2 makes the research lifecycle the primary product surface while retaining the Bridge boundary so the execution engine can evolve independently.

### Frontend

- Research Command: high-level pipeline, queue and research doctrine.
- Strategy Lab: strategy registry plus deterministic specifications.
- Experiments: immutable experiment ledger and comparable metrics.
- Validation Gates: explicit promotion gates with evidence.
- Risk Engine: hard constraints that AI cannot override.
- Market Monitor: observation-only live context; no forced signals.

### Backend contract

The frontend talks to the Bridge through stable research endpoints:

- `GET /bridge/research/strategies`
- `POST /bridge/research/strategies`
- `GET /bridge/research/experiments`
- `GET /bridge/research/experiments/:id`
- `POST /bridge/research/robustness`
- `POST /bridge/research/promote`
- existing `POST /bridge/backtest` remains the streaming execution contract

The Bridge is deliberately engine-agnostic. A production backend can route fast discovery workloads to VectorBT, event-driven validation to NautilusTrader, or use LEAN as an alternative full-stack engine.

## Strategy specification

Strategies must be represented as machine-testable data. Avoid phrases such as "strong trend", "clean breakout" or "looks like a sweep" unless they have an explicit measurable definition.

Example:

```json
{
  "id": "ORB-FVG-01",
  "market": "MNQ",
  "timeframe": "1m",
  "session": "US_RTH",
  "openingRange": {
    "start": "09:30",
    "end": "09:45",
    "timezone": "America/New_York"
  },
  "entry": {
    "direction": "breakout",
    "trigger": "close",
    "confirmation": ["fvg"]
  },
  "risk": {
    "riskPerTrade": 0.25,
    "stop": "fvg_extreme",
    "targetR": 2,
    "maxTradesPerDay": 1
  }
}
```

## Validation gates

1. **Specification** — deterministic and reproducible.
2. **Data integrity** — session/timezone/contract-roll and missing-data checks pass.
3. **Costs** — fees, spread and conservative slippage are included.
4. **Out-of-sample** — selection is made without touching the final evaluation period.
5. **Walk-forward** — edge persists across sequential train/test windows.
6. **Robustness** — reasonable parameter and execution perturbations do not destroy the edge.
7. **Monte Carlo** — return-path uncertainty stays inside approved loss tolerances.
8. **Paper** — live observation reconciles with the research assumptions.
9. **Promotion** — only then can a strategy become a candidate for deployment review.

## AI role

Harper AI is an orchestrator and critic.

It can:

- turn natural-language ideas into deterministic strategy specs;
- find duplicate or near-duplicate hypotheses;
- queue experiments;
- compare results;
- identify failed gates;
- propose the next falsification test;
- maintain the research journal.

It cannot:

- bypass risk gates;
- rewrite an experiment after seeing the result;
- label simulated output as live evidence;
- promote a strategy solely because of high in-sample performance;
- invent fills, market data or execution evidence.

## First research pack

Harper seeds three baselines:

1. 15m ORB + 1m FVG breakout.
2. Opening-range liquidity sweep/reversal.
3. Opening-range break + retest continuation.

These are **hypotheses**, not endorsed strategies. Each must be independently reproduced with controlled data and costs.

## Recommended implementation order

### Phase 1 — Research kernel

Build the backend strategy compiler, dataset registry, experiment runner and metrics writer. Make every run immutable and content-addressed by strategy + dataset + config.

### Phase 2 — Statistical validation

Add train/validation/out-of-sample splitting, walk-forward evaluation, parameter perturbation, slippage stress and Monte Carlo resampling.

### Phase 3 — Paper engine

Run the same strategy implementation against live market data in observation mode. Compare expected vs observed fills, timing and signal frequency.

### Phase 4 — Execution boundary

Only after the research kernel is stable should broker/prop-firm execution adapters be connected. Execution must consume a promoted candidate rather than directly from a chat message.

## Definition of done for v2

Harper v2 is considered operational when a user can enter:

> "Test the Reddit ORB/FVG idea on MNQ from 2021–2026."

and Harper can deterministically:

1. create the strategy specification;
2. validate the data requirements;
3. run a backtest with costs;
4. generate in-sample, validation and OOS results;
5. run walk-forward and robustness checks;
6. score the experiment;
7. show which gates passed/failed;
8. store the immutable experiment record;
9. recommend the next research action without executing live orders.
