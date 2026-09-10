-- Run once against a fresh database.
-- Locally: docker exec -i <postgres_container> psql -U scraper -d scraper < src/db/schema.sql
-- (docker-compose.yml also mounts this so it runs automatically on first container init)

CREATE TABLE IF NOT EXISTS jobs (
  id            BIGSERIAL PRIMARY KEY,
  url           TEXT NOT NULL,
  source        TEXT NOT NULL,               -- matches a key in definitions/index.ts
  page_type     TEXT NOT NULL DEFAULT 'detail', -- matches a key in that source's Definition.pageTypes
  parent_job_id BIGINT REFERENCES jobs(id),  -- the list job that discovered this job, if any
  status        TEXT NOT NULL DEFAULT 'pending', -- pending | processing | done | failed
  attempts      INT NOT NULL DEFAULT 0,
  max_attempts  INT NOT NULL DEFAULT 3,
  worker_id     TEXT,
  locked_at     TIMESTAMPTZ,
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Speeds up "which jobs did this list job spawn" lookups
CREATE INDEX IF NOT EXISTS idx_jobs_parent_job_id
  ON jobs (parent_job_id)
  WHERE parent_job_id IS NOT NULL;

-- Speeds up the claim query: WHERE status = 'pending'
CREATE INDEX IF NOT EXISTS idx_jobs_pending
  ON jobs (id)
  WHERE status = 'pending';

-- Speeds up the reclaim sweep: WHERE status = 'processing' AND locked_at < ...
CREATE INDEX IF NOT EXISTS idx_jobs_processing
  ON jobs (locked_at)
  WHERE status = 'processing';

CREATE TABLE results (
  id BIGSERIAL,
  job_id BIGINT NOT NULL REFERENCES jobs(id),
  source TEXT NOT NULL,
  data JSONB NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, source)
) PARTITION BY LIST (source);

CREATE TABLE results_quotes PARTITION OF results FOR VALUES IN ('quotes');
CREATE TABLE results_default PARTITION OF results DEFAULT;
CREATE INDEX idx_results_job_id ON results (job_id);
