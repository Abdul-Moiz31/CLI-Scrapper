// shared Definition interface: a site is a set of page types (list | detail)

export interface PageTypeConfig {
  role: "list" | "detail";
  selectors?: Record<string, string>; // detail role: final fields to extract
  itemLinkSelector?: string; // list role: selector for links to child jobs
  nextPageSelector?: string; // list role: selector for the next listing page, if any
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
