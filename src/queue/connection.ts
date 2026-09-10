// amqplib connection + channel, asserts the queue exists
import amqp, { ChannelModel, ConfirmChannel } from "amqplib";
import { env } from "../config/env";

let connection: ChannelModel | null = null;
let channel: ConfirmChannel | null = null;

export async function getChannel(): Promise<ConfirmChannel> {
  if (channel) return channel;
  connection = await amqp.connect(env.rabbitmqUrl);
  channel = await connection.createConfirmChannel();
  await channel.assertQueue(env.queueName, { durable: true });
  await channel.prefetch(env.workerPrefetch);
  return channel;
}

export async function closeConnection(): Promise<void> {
  await connection?.close();
  connection = null;
  channel = null;
}
