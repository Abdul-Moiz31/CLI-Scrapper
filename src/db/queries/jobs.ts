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

// claim jobs: update a job's status to 'processing' and assign it to a worker if it's currently 'pending'
export async function claimJob(jobId: number, workerId: string): Promise<JobRow | null> {
  const result = await pool.query<JobRow>(
    `UPDATE jobs SET status = 'processing', worker_id = $1, locked_at = now(), updated_at = now()
     WHERE id = $2 AND status = 'pending'
     RETURNING *`,
    [workerId, jobId],
  );
  return result.rows[0] ?? null;
}

// mark jobs as done: update a job's status to 'done' if it's currently 'processing'
export async function markDone(jobId: number): Promise<JobRow | null> {
  const result = await pool.query<JobRow>(
    `UPDATE jobs SET status = 'done', updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [jobId],
  );
  return result.rows[0] ?? null;
}

// handle job failure: increment attempts, set status to 'failed' if max_attempts reached, otherwise set to 'pending', and store the error message
export async function handleFailure(jobId: number, errorMessage: string): Promise<JobRow | null> {
  const result = await pool.query<JobRow>(
    `UPDATE jobs
     SET attempts = attempts + 1,
         status = CASE WHEN attempts + 1 >= max_attempts THEN 'failed'
                       ELSE 'pending' END,
         error = $2,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [jobId, errorMessage],
  );
  return result.rows[0] ?? null;
}

// reclaim stuck jobs: find jobs that have been 'processing' for longer than the specified timeout and reset their status to 'pending' or 'failed' based on attempts

export async function reclaimStuckJobs(timeoutMinutes: number): Promise<JobRow[]> {
  const result = await pool.query<JobRow>(
    `UPDATE jobs
     SET attempts = attempts + 1,
         status = CASE WHEN attempts + 1 >= max_attempts THEN 'failed'
                       ELSE 'pending' END,
         error = 'reclaimed: worker did not complete in time',
         updated_at = now()
     WHERE status = 'processing'
       AND locked_at < now() - make_interval(mins => $1)
     RETURNING *`,
    [timeoutMinutes],
  );
  return result.rows;
}

// retry failed jobs: reset the status of failed jobs to 'pending' and clear the error message, optionally filtering by jobId

export async function retryFailedJobs(jobId?: number): Promise<JobRow[]> {
  const result = await pool.query<JobRow>(
    `UPDATE jobs SET status = 'pending', error = NULL, updated_at = now()
     WHERE status = 'failed' AND ($1::bigint IS NULL OR id = $1)
     RETURNING *`,
    [jobId ?? null],
  );
  return result.rows;
}
