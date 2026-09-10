// insertJob, claimJob (atomic), markDone, handleFailure, reclaimStuck
import { pool } from "../client";

export async function insertJob(url: string, source: string): Promise<number> {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO jobs (url, source) VALUES ($1, $2) RETURNING id`,
    [url, source],
  );
  return result.rows[0].id;
}

interface JobRow {
  id: number;
  url: string;
  source: string;
  status: string;
  attempts: number;
  max_attempts: number;
  worker_id: string | null;
  locked_at: Date | null;
  error: string | null;
  created_at: Date;
  updated_at: Date;
}

// claim jobs   it will update a job's status to 'processing' and assign it to a worker if it's currently 'pending'

export async function claimJob(jobId: number, workerId: string): Promise<JobRow | null> {
  const result = await pool.query<JobRow>(
    `UPDATE jobs SET status = 'processing', worker_id = $1, locked_at = now()
     WHERE id = $2 AND status = 'pending'
     RETURNING *`,
    [workerId, jobId],
  );
  return result.rows[0] ?? null;
}

export async function markDone(jobId: number): Promise<JobRow | null> {
  const result = await pool.query<JobRow>(
    `UPDATE jobs SET status = 'done', updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [jobId],
  );
  return result.rows[0] ?? null;
}

export async function handleFailure(jobId: number, errorMessage: string): Promise<JobRow | null> {
  const result = await pool.query<JobRow>(
    `UPDATE jobs
     SET attempts = attempts + 1,
         status = CASE WHEN attempts + 1 >= max_attempts THEN 'failed'
                       ELSE 'pending' END,
         error = $2
     WHERE id = $1
     RETURNING *`,
    [jobId, errorMessage],
  );
  return result.rows[0] ?? null;
}

export async function reclaimStuckJobs(timeoutMinutes: number): Promise<JobRow[]> {
  const result = await pool.query<JobRow>(
    `UPDATE jobs
     SET attempts = attempts + 1,
         status = CASE WHEN attempts + 1 >= max_attempts THEN 'failed'
                       ELSE 'pending' END,
         error = 'reclaimed: worker did not complete in time'
     WHERE status = 'processing'
       AND locked_at < now() - make_interval(mins => $1)
     RETURNING *`,
    [timeoutMinutes],
  );
  return result.rows;
}
