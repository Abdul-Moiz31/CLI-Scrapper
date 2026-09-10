// got + cheerio: fetch a page, extract its final fields (detail pages)
import got from "got";
import * as cheerio from "cheerio";
import { env } from "../config/env";

export async function fetchHtml(url: string): Promise<string> {
  return got(url, { timeout: { request: env.httpRequestTimeoutMs } }).text();
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
  return data;
}
