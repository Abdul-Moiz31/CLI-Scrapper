// insertJob, insertChildJobs, markDone, handleFailure
// (claimJob and its lookup helper live in claim.ts, split out for size)
import { pool } from "../client";
import { JobRow, ChildJobInput } from "../../types";

export async function insertJob(
  url: string,
  source: string,
  pageType: string,
  parentJobId: number | null = null,
): Promise<number> {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO jobs (url, source, page_type, parent_job_id) VALUES ($1, $2, $3, $4)
     ON CONFLICT (source, url) DO UPDATE SET updated_at = now() RETURNING id`,
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
    `INSERT INTO jobs (url, source, page_type, parent_job_id) VALUES ${values.join(", ")}
     ON CONFLICT (source, url) DO NOTHING RETURNING id`,
    params,
  );
  return result.rows.map((row) => row.id);
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

// handle job failure: increment attempts; mark 'failed' if permanent or max_attempts reached, else 'pending'
export async function handleFailure(jobId: number, errorMessage: string, permanent = false): Promise<JobRow | null> {
  const result = await pool.query<JobRow>(
    `UPDATE jobs
     SET attempts = attempts + 1,
         status = CASE WHEN $3 OR attempts + 1 >= max_attempts THEN 'failed' ELSE 'pending' END,
         error = $2,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [jobId, errorMessage, permanent],
  );
  return result.rows[0] ?? null;
}
