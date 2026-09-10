import { Definition } from "../types";
import { listSelectors, detailSelectors } from "./selectors";

export const scrapingcourse: Definition = {
  source: "scrapingcourse",
  engine: "http",
  maxConcurrency: 5,
  maxRetries: 3,
  entryPageType: "list",
  pageTypes: {
    list: {
      role: "list",
      itemLinkSelector: listSelectors.itemLink,
      nextPageSelector: listSelectors.nextPage,
      childPageType: "detail",
    },
    detail: {
      role: "detail",
      selectors: detailSelectors,
    },
  },
};
