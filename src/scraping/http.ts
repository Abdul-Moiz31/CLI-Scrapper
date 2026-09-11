// got + cheerio: fetch a page, extract its final fields (detail pages)
import got, { HTTPError } from "got";
import * as cheerio from "cheerio";
import { env } from "../config/env";
import { PermanentScrapeError } from "./errors";

export async function fetchHtml(url: string): Promise<string> {
  try {
    return await got(url, { timeout: { request: env.httpRequestTimeoutMs } }).text();
  } catch (error) {
    if (error instanceof HTTPError && error.response.statusCode === 404) {
      throw new PermanentScrapeError(`404 Not Found: ${url}`);
    }
    throw error;
  }
}

export function extractFields(
  html: string,
  selectors: Record<string, string>,
): Record<string, string> {
  const $ = cheerio.load(html);
  const data: Record<string, string> = {};
  for (const [field, selector] of Object.entries(selectors)) {
    data[field] = $(selector).first().text().trim();
  }

  if (Object.values(data).every((value) => value === "")) {
    throw new PermanentScrapeError("all selectors matched no content, page layout may have changed");
  }

  return data;
}
