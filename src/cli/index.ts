// Commander setup, registers scrape and retry-failed commands
import { Command } from "commander";
import { scrapeCommand } from "./commands/scrape";
import { retryFailedCommand } from "./commands/retryFailed";
import { logger } from "../logger";
import { closeConnection } from "../queue/connection";
import { pool } from "../db/client";

const program = new Command();

program
  .command("scrape")
  .requiredOption("--url <url>", "URL to scrape")
  .requiredOption("--source <source>", "site definition to use")
  .option("--page-type <pageType>", "entry page type, defaults to the definition's entryPageType")
  .action(async (options: { url: string; source: string; pageType?: string }) => {
    try {
      await scrapeCommand(options.url, options.source, options.pageType);
    } catch (err) {
      logger.error(err, "scrape command failed");
      process.exitCode = 1;
    }
  });

program
  .command("retry-failed")
  .option("--id <id>", "retry a specific failed job", Number)
  .action(async (options: { id?: number }) => {
    try {
      await retryFailedCommand(options.id);
    } catch (err) {
      logger.error(err, "retry-failed command failed");
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv).then(async () => {
  await closeConnection();
  await pool.end();
  process.exit(process.exitCode ?? 0);
});
