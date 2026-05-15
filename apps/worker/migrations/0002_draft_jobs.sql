CREATE TABLE IF NOT EXISTS draft_jobs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued','claimed','done','failed')),
  auth_mode TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  request_json TEXT NOT NULL,
  result_json TEXT,
  error_message TEXT,
  claimed_by TEXT,
  claimed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_draft_jobs_status_created ON draft_jobs(status, created_at ASC);
