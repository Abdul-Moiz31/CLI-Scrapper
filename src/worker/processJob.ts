// claim -> definition/proxy -> scrape -> extract -> save -> success/failure
import { claimJob } from "../db/queries/jobs";
import { logger } from "../logger";

export async function processJob(jobId: number, workerId: string): Promise<void> {
  const job = await claimJob(jobId, workerId);

  if (job) {
    logger.info({ jobId, workerId }, "claimed");
  } else {
    logger.info({ jobId, workerId }, "not claimed");
  }
}
