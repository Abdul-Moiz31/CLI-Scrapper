import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  databaseUrl: requireEnv("DATABASE_URL"),
  rabbitmqUrl: requireEnv("RABBITMQ_URL"),
  queueName: requireEnv("QUEUE_NAME"),
  workerPrefetch: Number(requireEnv("WORKER_PREFETCH")),
};
