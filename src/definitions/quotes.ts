import { Definition } from "./types";

export const quotes: Definition = {
  source: "quotes",
  engine: "http",
  maxConcurrency: 5,
  maxRetries: 3,
  entryPageType: "detail",
  pageTypes: {
    detail: {
      role: "detail",
      selectors: {
        text: "span.text",
        author: "small.author",
      },
    },
  },
};
