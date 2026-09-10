// process entrypoint: connect, start consuming, start reclaim interval
import { startConsumer } from "../queue/consumer";
import { logger } from "../logger";

const workerId = String(process.pid);

async function main(): Promise<void> {
  await startConsumer(workerId);
  logger.info({ workerId }, "worker started");
}

main();
