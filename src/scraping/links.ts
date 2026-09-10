// cheerio: extract item links + next-page link from a list page
import * as cheerio from "cheerio";

export interface ExtractedLinks {
  itemUrls: string[];
  nextUrl: string | null;
}

export function extractLinks(
  html: string,
  baseUrl: string,
  itemLinkSelector: string,
  nextPageSelector?: string,
): ExtractedLinks {
  const $ = cheerio.load(html);

  const itemUrls = $(itemLinkSelector)
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter((href): href is string => Boolean(href))
    .map((href) => new URL(href, baseUrl).toString());

  const nextHref = nextPageSelector ? $(nextPageSelector).attr("href") : undefined;
  const nextUrl = nextHref ? new URL(nextHref, baseUrl).toString() : null;

  return { itemUrls, nextUrl };
}
