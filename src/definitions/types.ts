// shared Definition interface (selectors, engine, concurrency, retries)

export interface Definition {
  source: string;
  engine: "http";
  selectors: Record<string, string>;
  maxConcurrency: number;
  maxRetries: number;
}
