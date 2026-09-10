// setInterval wrapper around the reclaim query
import { reclaimStuckJobs } from "../db/queries/jobs";
import { publishJob } from "../queue/publisher";
import { env } from "../config/env";
import { logger } from "../logger";

export function startReclaimSweep(): void {
  setInterval(async () => {
    const reclaimed = await reclaimStuckJobs(env.reclaimTimeoutMinutes);

    let pending = 0;
    let failed = 0;

    for (const job of reclaimed) {
      if (job.status === "pending") {
        await publishJob(job.id);
        pending += 1;
      } else if (job.status === "failed") {
        failed += 1;
      }
    }

    logger.info(
      { reclaimed: reclaimed.length, pending, failed },
      "reclaim sweep",
    );
  }, env.reclaimCheckIntervalMs);
}
