// reclaimStuckJobs, retryFailedJobs — background/admin operations, not the per-job hot path
import { pool } from "../client";
import { JobRow } from "../../types";

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
