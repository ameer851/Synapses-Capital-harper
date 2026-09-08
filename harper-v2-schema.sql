-- Harper v2 research schema
-- Additive migration: keeps the original portfolio tables intact while moving research state into a first-class ledger.

CREATE TABLE IF NOT EXISTS strategies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','baseline','testing','paper','candidate','retired')),
  market TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  specification JSONB NOT NULL,
  hypothesis TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS experiments (
  id TEXT PRIMARY KEY,
  strategy_id TEXT NOT NULL REFERENCES strategies(id),
  engine TEXT NOT NULL,
  dataset_id TEXT NOT NULL,
  config JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','complete','failed','rejected')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS experiment_metrics (
  experiment_id TEXT PRIMARY KEY REFERENCES experiments(id) ON DELETE CASCADE,
  trades INTEGER NOT NULL DEFAULT 0,
  win_rate NUMERIC,
  profit_factor NUMERIC,
  sharpe NUMERIC,
  sortino NUMERIC,
  max_drawdown NUMERIC,
  total_return NUMERIC,
  oos_return NUMERIC,
  expectancy_r NUMERIC,
  avg_r NUMERIC,
  robustness_score NUMERIC,
  monte_carlo_p05 NUMERIC,
  raw JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS validation_gates (
  experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  gate_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','pass','fail','warning')),
  evidence JSONB NOT NULL DEFAULT '{}',
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (experiment_id, gate_id)
);

CREATE TABLE IF NOT EXISTS datasets (
  id TEXT PRIMARY KEY,
  market TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  provider TEXT NOT NULL,
  quality_report JSONB NOT NULL DEFAULT '{}',
  checksum TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS research_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'harper',
  object_type TEXT,
  object_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experiments_strategy ON experiments(strategy_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_validation_gate_status ON validation_gates(status);
CREATE INDEX IF NOT EXISTS idx_research_events_time ON research_events(occurred_at);

ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_events ENABLE ROW LEVEL SECURITY;

-- Single-user development policies. Replace with authenticated-user policies before multi-user deployment.
CREATE POLICY "harper_dev_strategies" ON strategies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "harper_dev_experiments" ON experiments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "harper_dev_metrics" ON experiment_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "harper_dev_gates" ON validation_gates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "harper_dev_datasets" ON datasets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "harper_dev_events" ON research_events FOR ALL USING (true) WITH CHECK (true);
