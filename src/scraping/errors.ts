// thrown for failures that retrying the same way will not resolve (404, dead selectors)
export class PermanentScrapeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermanentScrapeError";
  }
}
