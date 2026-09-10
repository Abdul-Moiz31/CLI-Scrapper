// insertJob, insertChildJobs, claimJob (atomic), markDone, handleFailure
import { pool } from "../client";
import { JobRow, ChildJobInput } from "../../types";

export async function insertJob(
  url: string,
  source: string,
  pageType: string,
  parentJobId: number | null = null,
): Promise<number> {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO jobs (url, source, page_type, parent_job_id) VALUES ($1, $2, $3, $4) RETURNING id`,
    [url, source, pageType, parentJobId],
  );
  return result.rows[0].id;
}

// insert a batch of jobs discovered by one list job, in a single round trip
export async function insertChildJobs(
  parentJobId: number,
  source: string,
  children: ChildJobInput[],
): Promise<number[]> {
  if (children.length === 0) return [];

  const values: string[] = [];
  const params: unknown[] = [];
  children.forEach((child, i) => {
    const offset = i * 4;
    values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
    params.push(child.url, source, child.pageType, parentJobId);
  });

  const result = await pool.query<{ id: number }>(
    `INSERT INTO jobs (url, source, page_type, parent_job_id) VALUES ${values.join(", ")} RETURNING id`,
    params,
  );
  return result.rows.map((row) => row.id);
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
