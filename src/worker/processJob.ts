// claim -> fetch -> list: fan out children | detail: save result -> success/failure
import { claimJob, markDone, handleFailure, insertChildJobs } from "../db/queries/jobs";
import { saveResult } from "../db/queries/results";
import { definitions } from "../definitions";
import { fetchHtml, extractFields } from "../scraping/http";
import { extractLinks } from "../scraping/links";
import { publishJob } from "../queue/publisher";
import { PermanentScrapeError } from "../scraping/errors";
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
    const pageConfig = definition.pageTypes[job.page_type];
    const html = await fetchHtml(job.url);

    if (pageConfig.role === "list") {
      const { itemUrls, nextUrl } = extractLinks(
        html,
        job.url,
        pageConfig.itemLinkSelector!,
        pageConfig.nextPageSelector,
      );

      const children = itemUrls.map((url) => ({ url, pageType: pageConfig.childPageType! }));
      if (nextUrl) children.push({ url: nextUrl, pageType: job.page_type });

      const childIds = await insertChildJobs(job.id, job.source, children);
      for (const childId of childIds) {
        await publishJob(childId);
      }
    } else {
      const data = extractFields(html, pageConfig.selectors!);
      await saveResult(job.id, job.source, data);
    }

    await markDone(job.id);
  } catch (error) {
    logger.error({ jobId, workerId, error }, "job failed");
    const errorMessage = error instanceof Error ? error.message : String(error);
    const permanent = error instanceof PermanentScrapeError;
    const updated = await handleFailure(job.id, errorMessage, permanent);
    if (updated?.status === "pending") {
      await publishJob(job.id);
    }
  }
}
