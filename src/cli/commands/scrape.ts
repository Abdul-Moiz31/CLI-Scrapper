// validate url, insert job into Postgres, publish to RabbitMQ
import { insertJob } from "../../db/queries/jobs";
import { publishJob } from "../../queue/publisher";
import { definitions } from "../../definitions";
import { logger } from "../../logger";

export async function scrapeCommand(url: string, source: string): Promise<void> {
  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  const definition = definitions[source];
  if (!definition) {
    throw new Error(`Unknown source: ${source}`);
  }

  const jobId = await insertJob(url, source, definition.entryPageType);
  await publishJob(jobId);

  logger.info({ jobId, url, source, pageType: definition.entryPageType }, "job queued");
}
