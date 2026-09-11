// shared Definition interface: a site is a set of page types (list | detail)

export interface OffsetPagination {
  url: string; // fixed endpoint the offset is applied to (may differ from the entry URL)
  param: string; // query param name carrying the offset
  pageSize: number; // amount to advance the offset by each page
}

export interface PageTypeConfig {
  role: "list" | "detail";
  selectors?: Record<string, string>; // detail role: final fields to extract
  itemLinkSelector?: string; // list role: selector for links to child jobs
  nextPageSelector?: string; // list role: next page is discovered via this link's href
  offsetPagination?: OffsetPagination; // list role: next page is computed, not discovered
  childPageType?: string; // list role: page_type assigned to jobs made from itemLinkSelector
}

export interface Definition {
  source: string;
  engine: "http";
  maxConcurrency: number;
  maxRetries: number;
  entryPageType: string; // page_type a freshly CLI-queued job for this source starts at
  pageTypes: Record<string, PageTypeConfig>;
}
