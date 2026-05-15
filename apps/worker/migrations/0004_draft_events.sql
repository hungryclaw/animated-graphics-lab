CREATE TABLE IF NOT EXISTS draft_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  data_json TEXT,
  FOREIGN KEY(draft_id) REFERENCES draft_jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_draft_events_draft ON draft_events(draft_id, id ASC);
