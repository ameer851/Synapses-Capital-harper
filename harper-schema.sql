-- ── Harper Dashboard Schema · Synapses Capital ────────────────────────────────
-- Run this in your Supabase project SQL Editor before connecting the dashboard.

-- ── Portfolio (single row) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio (
  id            TEXT PRIMARY KEY DEFAULT 'synapses-capital',
  cash          NUMERIC NOT NULL DEFAULT 100.00,
  starting_cash NUMERIC NOT NULL DEFAULT 100.00,
  regime        TEXT NOT NULL DEFAULT 'NORMAL'
                CHECK (regime IN ('DEFENSIVE','NORMAL','STRONG_OPPORTUNITY')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO portfolio (id, cash, starting_cash, regime)
VALUES ('synapses-capital', 100.00, 100.00, 'NORMAL')
ON CONFLICT (id) DO NOTHING;

-- ── Positions ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS positions (
  id            SERIAL PRIMARY KEY,
  ticker        TEXT NOT NULL,
  name          TEXT,
  sector        TEXT,
  style         TEXT NOT NULL DEFAULT 'POSITION'
                CHECK (style IN ('POSITION','INTRADAY')),
  thesis_type   TEXT NOT NULL DEFAULT 'MOMENTUM'
                CHECK (thesis_type IN ('MOMENTUM','CATALYST','QUALITY','VALUE')),
  shares        NUMERIC NOT NULL,
  entry_price   NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  target_price  NUMERIC,
  invalidation  NUMERIC,
  thesis        TEXT,
  confidence    NUMERIC DEFAULT 0.70,
  status        TEXT NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE','CLOSED','PENDING_RESOLUTION')),
  close_price   NUMERIC,
  realised_pnl  NUMERIC,
  opened_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at     TIMESTAMPTZ
);

-- ── Decisions (audit log) ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS decisions (
  id          SERIAL PRIMARY KEY,
  action      TEXT NOT NULL CHECK (action IN ('BUY','SELL','NO_TRADE')),
  ticker      TEXT NOT NULL,
  size_usd    NUMERIC,
  gate        TEXT,
  pnl         NUMERIC,
  reason      TEXT,
  position_id INTEGER REFERENCES positions(id),
  decided_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Forecasts (Brier-score calibration) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forecasts (
  id          SERIAL PRIMARY KEY,
  event       TEXT NOT NULL,
  confidence  NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  outcome     TEXT NOT NULL DEFAULT 'PENDING'
              CHECK (outcome IN ('PENDING','CORRECT','WRONG')),
  filed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ── NAV snapshots (sparkline history) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nav_snapshots (
  id        SERIAL PRIMARY KEY,
  nav       NUMERIC NOT NULL,
  cash      NUMERIC NOT NULL,
  exposure  NUMERIC NOT NULL,
  snapped_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Candidates (daily screens) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidates (
  id       SERIAL PRIMARY KEY,
  ticker   TEXT NOT NULL,
  gate     TEXT,
  depth    TEXT,
  verdict  TEXT NOT NULL DEFAULT 'PENDING'
           CHECK (verdict IN ('QUALIFIED','PENDING','REJECTED')),
  score    NUMERIC,
  run_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ── RLS (open for single-user dashboard — tighten in production) ───────────────
ALTER TABLE portfolio     ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE nav_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_portfolio"     ON portfolio     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_positions"     ON positions     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_decisions"     ON decisions     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_forecasts"     ON forecasts     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_nav_snapshots" ON nav_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_candidates"    ON candidates    FOR ALL USING (true) WITH CHECK (true);

-- ── Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_positions_status   ON positions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_time     ON decisions(decided_at);
CREATE INDEX IF NOT EXISTS idx_nav_snapshots_time ON nav_snapshots(snapped_at);
CREATE INDEX IF NOT EXISTS idx_candidates_date    ON candidates(run_date);

-- ── Seed initial NAV snapshot ──────────────────────────────────────────────────
INSERT INTO nav_snapshots (nav, cash, exposure)
VALUES (100.00, 100.00, 0);
