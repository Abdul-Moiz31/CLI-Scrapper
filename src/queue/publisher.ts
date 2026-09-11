// publishJob(jobId), publishJobDelayed(jobId)
import { getChannel, delayQueueName } from "./connection";
import { env } from "../config/env";

export async function publishJob(jobId: number): Promise<void> {
  const channel = await getChannel();
  channel.sendToQueue(env.queueName, Buffer.from(JSON.stringify({ jobId })), {
    persistent: true,
  });
  await channel.waitForConfirms();
}

// used when a claim is blocked on a source's maxConcurrency: parks the job on
// the delay queue instead of the main one, so it comes back after a pause
// instead of immediately re-blocking
export async function publishJobDelayed(jobId: number): Promise<void> {
  const channel = await getChannel();
  channel.sendToQueue(delayQueueName, Buffer.from(JSON.stringify({ jobId })), {
    persistent: true,
  });
  await channel.waitForConfirms();
}
