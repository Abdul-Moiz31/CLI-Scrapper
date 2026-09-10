// publishJob(jobId)
import { getChannel } from "./connection";
import { env } from "../config/env";

export async function publishJob(jobId: number): Promise<void> {
  const channel = await getChannel();
  channel.sendToQueue(env.queueName, Buffer.from(JSON.stringify({ jobId })), {
    persistent: true,
  });
  await channel.waitForConfirms();
}
