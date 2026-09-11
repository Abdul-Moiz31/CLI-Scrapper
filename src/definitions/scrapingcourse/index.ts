import { Definition } from "../types";
import { listSelectors, detailSelectors, paginationListSelectors } from "./selectors";

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
    // scrapingcourse.com/pagination: different markup, same products/detail
    paginationList: {
      role: "list",
      itemLinkSelector: paginationListSelectors.itemLink,
      nextPageSelector: paginationListSelectors.nextPage,
      childPageType: "detail",
    },
    // scrapingcourse.com/button-click: offset-based "load more", same products
    buttonClickList: {
      role: "list",
      itemLinkSelector: paginationListSelectors.itemLink,
      offsetPagination: {
        url: "https://www.scrapingcourse.com/ajax/products",
        param: "offset",
        pageSize: 10,
      },
      childPageType: "detail",
    },
    detail: {
      role: "detail",
      selectors: detailSelectors,
    },
  },
};
