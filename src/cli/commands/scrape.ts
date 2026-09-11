// validate url, insert job into Postgres, publish to RabbitMQ
import { insertJob } from "../../db/queries/jobs";
import { publishJob } from "../../queue/publisher";
import { definitions } from "../../definitions";
import { logger } from "../../logger";

export async function scrapeCommand(url: string, source: string, pageType?: string): Promise<void> {
  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  const definition = definitions[source];
  if (!definition) {
    throw new Error(`Unknown source: ${source}`);
  }

  const resolvedPageType = pageType ?? definition.entryPageType;
  if (!definition.pageTypes[resolvedPageType]) {
    throw new Error(`Unknown page type "${resolvedPageType}" for source: ${source}`);
  }

  const jobId = await insertJob(url, source, resolvedPageType);
  await publishJob(jobId);

  logger.info({ jobId, url, source, pageType: resolvedPageType }, "job queued");
}
