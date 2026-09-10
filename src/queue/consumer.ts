// consume loop, hands each message to worker/processJob
import { getChannel } from "./connection";
import { env } from "../config/env";
import { processJob } from "../worker/processJob";
import { logger } from "../logger";

export async function startConsumer(workerId: string): Promise<void> {
  const channel = await getChannel();

  await channel.consume(env.queueName, async (msg) => {
    if (!msg) return;

    const { jobId } = JSON.parse(msg.content.toString()) as { jobId: number };

    try {
      await processJob(jobId, workerId);
    } catch (err) {
      logger.error(err, "processJob failed");
    }

    channel.ack(msg);
  });
}
