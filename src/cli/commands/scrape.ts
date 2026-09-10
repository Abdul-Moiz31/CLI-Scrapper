// validate url, insert job into Postgres, publish to RabbitMQ
import { insertJob } from "../../db/queries/jobs";
import { publishJob } from "../../queue/publisher";
import { logger } from "../../logger";

export async function scrapeCommand(url: string, source: string): Promise<void> {
  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  const jobId = await insertJob(url, source);
  await publishJob(jobId);

  logger.info({ jobId, url, source }, "job queued");
}
