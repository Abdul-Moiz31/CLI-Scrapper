// amqplib connection + channel, asserts the queue exists
import amqp, { ChannelModel, ConfirmChannel } from "amqplib";
import { env } from "../config/env";

let connection: ChannelModel | null = null;
let channel: ConfirmChannel | null = null;

// backs off a concurrency-blocked job: messages here dead-letter back into
// the main queue via the default exchange once their TTL expires, so a job
// blocked on maxConcurrency gets retried after a delay instead of busy-looping
export const delayQueueName = `${env.queueName}.delay`;

export async function getChannel(): Promise<ConfirmChannel> {
  if (channel) return channel;
  connection = await amqp.connect(env.rabbitmqUrl);
  channel = await connection.createConfirmChannel();
  await channel.assertQueue(env.queueName, { durable: true });
  await channel.assertQueue(delayQueueName, {
    durable: true,
    arguments: {
      "x-message-ttl": env.concurrencyRetryDelayMs,
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": env.queueName,
    },
  });
  await channel.prefetch(env.workerPrefetch);
  return channel;
}

export async function closeConnection(): Promise<void> {
  await connection?.close();
  connection = null;
  channel = null;
}
