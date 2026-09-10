import { Definition } from "./types";

export const quotes: Definition = {
  source: "quotes",
  engine: "http",
  selectors: {
    text: "span.text",
    author: "small.author",
  },
  maxConcurrency: 5,
  maxRetries: 3,
};
