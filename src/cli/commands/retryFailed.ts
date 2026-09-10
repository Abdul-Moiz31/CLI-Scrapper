// query failed jobs, reset to pending, republish
import { retryFailedJobs } from "../../db/queries/jobsMaintenance";
import { publishJob } from "../../queue/publisher";
import { logger } from "../../logger";

export async function retryFailedCommand(jobId?: number): Promise<void> {
  const jobs = await retryFailedJobs(jobId);

  for (const job of jobs) {
    await publishJob(job.id);
  }

  logger.info({ count: jobs.length, jobIds: jobs.map((j) => j.id) }, "retried failed jobs");
}
