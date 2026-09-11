// cheerio: extract item links + next-page link from a list page
import * as cheerio from "cheerio";
import { OffsetPagination } from "../definitions/types";

export interface ExtractedLinks {
  itemUrls: string[];
  nextUrl: string | null;
}

export function extractLinks(
  html: string,
  baseUrl: string,
  itemLinkSelector: string,
  nextPageSelector?: string,
  offsetPagination?: OffsetPagination,
): ExtractedLinks {
  const $ = cheerio.load(html);

  const itemUrls = $(itemLinkSelector)
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter((href): href is string => Boolean(href))
    .map((href) => new URL(href, baseUrl).toString());

  let nextUrl: string | null = null;
  if (nextPageSelector) {
    const nextHref = $(nextPageSelector).attr("href");
    nextUrl = nextHref ? new URL(nextHref, baseUrl).toString() : null;
  } else if (offsetPagination && itemUrls.length > 0) {
    nextUrl = computeNextOffsetUrl(baseUrl, offsetPagination);
  }

  return { itemUrls, nextUrl };
}

// mirrors the site's own click handler: read the running offset off the
// current URL (0 if this is the entry page and has none yet), advance it by
// pageSize, and apply it to the fixed endpoint - not necessarily the same
// path as the current URL, since the entry page and the ajax endpoint differ
function computeNextOffsetUrl(currentUrl: string, { url, param, pageSize }: OffsetPagination): string {
  const current = Number(new URL(currentUrl).searchParams.get(param) ?? 0);
  const next = new URL(url);
  next.searchParams.set(param, String(current + pageSize));
  return next.toString();
}
