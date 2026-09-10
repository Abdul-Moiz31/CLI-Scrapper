// claim -> definition/proxy -> scrape -> extract -> save -> success/failure
import { claimJob, markDone, handleFailure } from "../db/queries/jobs";
import { saveResult } from "../db/queries/results";
import { definitions } from "../definitions";
import { fetchAndExtract } from "../scraping/http";
import { publishJob } from "../queue/publisher";
import { logger } from "../logger";

export async function processJob(jobId: number, workerId: string): Promise<void> {
  const job = await claimJob(jobId, workerId);

  if (!job) {
    logger.info({ jobId, workerId }, "not claimed");
    return;
  }

  logger.info({ jobId, workerId }, "claimed");

  try {
    const definition = definitions[job.source];
    const data = await fetchAndExtract(job.url, definition.selectors);
    await saveResult(job.id, job.source, data);
    await markDone(job.id);
  } catch (error) {
    logger.error({ jobId, workerId, error }, "job failed");
    const errorMessage = error instanceof Error ? error.message : String(error);
    const updated = await handleFailure(job.id, errorMessage);
    if (updated?.status === "pending") {
      await publishJob(job.id);
    }
  }
}
