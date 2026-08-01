CREATE TABLE IF NOT EXISTS training_runs (
    id             SERIAL PRIMARY KEY,
    episodes       INTEGER NOT NULL,
    best_score     INTEGER NOT NULL,
    final_epsilon  REAL NOT NULL,
    q_table        JSONB NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
