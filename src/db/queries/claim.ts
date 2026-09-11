// getJobSourceAndStatus, claimJob (atomic, concurrency-gated)
import { pool } from "../client";
import { JobRow } from "../../types";

// read-only lookup used before claiming: source is immutable once inserted, so
// reading it here doesn't reintroduce the SELECT-then-UPDATE claim race
export async function getJobSourceAndStatus(
  jobId: number,
): Promise<{ source: string; status: string } | null> {
  const result = await pool.query<{ source: string; status: string }>(
    `SELECT source, status FROM jobs WHERE id = $1`,
    [jobId],
  );
  return result.rows[0] ?? null;
}

// claim a job: update its status to 'processing' if it's currently 'pending' AND
// the source's in-flight count is under maxConcurrency. The advisory lock
// serializes concurrent claims for the same source so the in-flight count (read
// by the subquery below) can't go stale between two simultaneous claims -
// otherwise two claims of *different* jobs of the same source could both read
// the count before either commits and both pass, overshooting the cap. It must
// run on one dedicated client: pg_advisory_xact_lock only holds for the
// transaction of the connection that acquired it.
export async function claimJob(
  jobId: number,
  workerId: string,
  source: string,
  maxConcurrency: number,
): Promise<JobRow | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [source]);
    const result = await client.query<JobRow>(
      `UPDATE jobs SET status = 'processing', worker_id = $1, locked_at = now(), updated_at = now()
       WHERE id = $2 AND status = 'pending'
         AND (SELECT count(*) FROM jobs WHERE source = $3 AND status = 'processing') < $4
       RETURNING *`,
      [workerId, jobId, source, maxConcurrency],
    );
    await client.query("COMMIT");
    return result.rows[0] ?? null;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
