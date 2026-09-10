// registry: source string -> Definition
import { Definition } from "./types";
import { quotes } from "./quotes";
import { scrapingcourse } from "./scrapingcourse";

export const definitions: Record<string, Definition> = {
  quotes,
  scrapingcourse,
};
