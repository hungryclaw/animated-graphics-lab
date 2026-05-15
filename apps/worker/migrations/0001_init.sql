CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL,
  queue_index INTEGER NOT NULL,
  priority INTEGER DEFAULT 0,
  auth_mode TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  concept_text TEXT NOT NULL,
  article_context TEXT,
  style_preset TEXT NOT NULL,
  aspect_preset TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  duration_seconds REAL NOT NULL,
  fps INTEGER DEFAULT 30,
  reference_asset_id TEXT,
  design_md_asset_id TEXT,
  composition_spec_json TEXT,
  source_bundle_url TEXT,
  preview_url TEXT,
  mp4_url TEXT,
  gif_url TEXT,
  drive_view_url TEXT,
  drive_download_url TEXT,
  error_message TEXT,
  claimed_by TEXT,
  claimed_at TEXT
);
CREATE TABLE IF NOT EXISTS job_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  data_json TEXT
);
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  kind TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_jobs_status_queue ON jobs(status, priority DESC, queue_index ASC);
CREATE INDEX IF NOT EXISTS idx_events_job ON job_events(job_id, id ASC);
