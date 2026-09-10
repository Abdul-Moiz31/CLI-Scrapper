// got + cheerio fetch and extract
import got from "got";
import * as cheerio from "cheerio";
import { env } from "../config/env";

export async function fetchAndExtract(
  url: string,
  selectors: Record<string, string>,
): Promise<Record<string, string>> {
  const html = await got(url, { timeout: { request: env.httpRequestTimeoutMs } }).text();
  const $ = cheerio.load(html);

  const data: Record<string, string> = {};
  for (const [field, selector] of Object.entries(selectors)) {
    data[field] = $(selector).first().text().trim();
  }
  return data;
}
