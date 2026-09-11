# Project: node-scraper-cli

A CLI-driven web scraper. A URL comes in via the CLI, gets queued, and a pool
of workers scrape it using a per-site definition (selectors, engine type,
concurrency limit).

## Stack
Node + TypeScript (strict), Commander (CLI), amqplib (RabbitMQ), raw `pg`
(no ORM), got + cheerio (HTTP scraping, added when we reach that step),
Playwright (browser scraping, added when we reach that step), PM2 (running
multiple worker instances), pino (logging). Package manager: pnpm.

## Architecture rules, non-negotiable

- Postgres is the only source of truth for job state. RabbitMQ only
  dispatches job ids, it never holds or implies state.
- Every claim, reclaim, and status change is a single atomic
  `UPDATE ... WHERE ... RETURNING` statement. Never split into a SELECT
  followed by a separate UPDATE, that reintroduces the exact race condition
  the atomic claim exists to prevent.
- A RabbitMQ message is only acked after its corresponding Postgres write
  has fully succeeded, never before.
- Retrying a failed job means resetting status to 'pending' in Postgres
  AND publishing a new message back to RabbitMQ. Resetting status alone
  does not bring a job back into circulation, since the original message
  is already gone once acked.
- Definitions (`definitions/**`) and the proxy pool (`proxy/pool.ts`) hold
  data and pure transformation functions only (e.g. string -> cleaned
  value). They never contain orchestration logic: no DB calls, no queue
  calls, no proxy/concurrency decisions. That logic lives in
  `worker/processJob.ts`.
- All SQL lives in `db/queries/`. No other file writes a raw query.
- A definition is a flat file (`definitions/ebay.ts`) by default. It only
  gets promoted to a folder (`definitions/amazon/`) once it needs more than
  one page type, or its selectors + transformers genuinely exceed ~40
  lines. Never create folder structure for a site preemptively.
- No magic numbers. `max_attempts`, the reclaim timeout, concurrency
  limits come from `config/env.ts` or a definition object, never typed
  literally inside logic.

## Schema evolution rules, non-negotiable

- Adding a definition, or changing which fields an existing definition
  scrapes, is not done until `schema.sql` reflects it in the same change:
  a new source gets its own `results_<source>` partition, and any new
  field that needs to be queryable gets its own typed column there.
  Never let a source fall through to a default/fallback partition.
- Never drop a column from a results table because a definition stopped
  scraping that field. Make it nullable and leave it in place. The
  historical rows already hold data in it, dropping the column destroys
  that history.

## File size expectations

Most files stay under ~40 lines. Four exceptions allowed to run 60-80
lines because they carry the real logic of this system:
`db/queries/jobs.ts`, `db/queries/claim.ts`, `worker/processJob.ts`,
`proxy/manager.ts`. If any other file grows past 40 lines, split it.

## Build order (do not skip ahead)

1. docker-compose up, confirm Postgres + RabbitMQ both running
2. Schema applied (src/db/schema.sql)
3. CLI: insert job + publish only, verify row + message exist
4. One worker: claim only, log claimed vs not-claimed, no scraping yet
5. Run 3-4 workers concurrently, confirm no job is ever double-claimed
6. Add exactly one definition, full happy path end to end
7. Add the failure path: attempts, retry vs mark failed, republish
8. Add the reclaim sweep last, timeout based on real observed job duration

## Folder structure

src/
  cli/                  CLI entrypoint + commands (scrape, retry-failed)
  db/                   Postgres client, schema.sql, all queries
  queue/                RabbitMQ connection, publisher, consumer
  worker/               Worker entrypoint, per-job processing, reclaim sweep
  definitions/           Per-site scraping rules (data + pure transforms)
  scraping/              http.ts (got+cheerio) and browser.ts (Playwright)
  proxy/                 manager.ts (rotation/logic), pool.ts (data)
  config/                env.ts
  logger.ts, types.ts    shared across the project
