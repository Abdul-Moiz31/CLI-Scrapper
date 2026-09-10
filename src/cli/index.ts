// Commander setup, registers scrape and retry-failed commands
import { Command } from "commander";
import { scrapeCommand } from "./commands/scrape";
import { logger } from "../logger";
import { closeConnection } from "../queue/connection";
import { pool } from "../db/client";

const program = new Command();

program
  .command("scrape")
  .requiredOption("--url <url>", "URL to scrape")
  .requiredOption("--source <source>", "site definition to use")
  .action(async (options: { url: string; source: string }) => {
    try {
      await scrapeCommand(options.url, options.source);
    } catch (err) {
      logger.error(err, "scrape command failed");
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv).then(async () => {
  await closeConnection();
  await pool.end();
  process.exit(process.exitCode ?? 0);
});
