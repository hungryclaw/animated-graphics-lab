CREATE TABLE IF NOT EXISTS article_analysis_jobs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued','claimed','done','failed')),
  claimed_by TEXT,
  claimed_at TEXT,
  auth_mode TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  request_json TEXT NOT NULL,
  result_json TEXT,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_article_analysis_jobs_status_created
ON article_analysis_jobs(status, created_at);
