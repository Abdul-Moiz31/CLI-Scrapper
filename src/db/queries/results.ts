// saveResult
import { pool } from "../client";

export async function saveResult(
  jobId: number,
  source: string,
  data: Record<string, unknown>,
): Promise<void> {
  await pool.query(
    `INSERT INTO results (job_id, source, data) VALUES ($1, $2, $3)
     ON CONFLICT (job_id, source) DO UPDATE SET data = EXCLUDED.data, scraped_at = now()`,
    [jobId, source, data],
  );
}
