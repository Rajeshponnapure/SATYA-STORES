import Redis from "ioredis";
import { RedisStore, type RedisReply } from "rate-limit-redis";

const redisUrl = process.env.REDIS_URL;
let redisClient: Redis | null = null;
let reportedRedisError = false;

function getRedisClient(): Redis | null {
  if (!redisUrl) return null;
  if (redisClient) return redisClient;

  redisClient = new Redis(redisUrl, {
    connectTimeout: 5_000,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
  });
  redisClient.on("error", (error) => {
    if (!reportedRedisError) {
      reportedRedisError = true;
      console.error("[Rate limit] Redis is unavailable; protected requests will fail closed until it recovers.", error.message);
    }
  });
  redisClient.on("ready", () => {
    reportedRedisError = false;
  });
  return redisClient;
}

/**
 * Uses a shared Redis counter when REDIS_URL is configured. The local fallback
 * is suitable only for a single development instance; production replicas must
 * set REDIS_URL so a request cannot evade limits by hitting another instance.
 */
export function createRateLimitStore(prefix: string): RedisStore | undefined {
  const client = getRedisClient();
  if (!client) return undefined;
  return new RedisStore({
    prefix,
    sendCommand: (command: string, ...args: string[]) =>
      client.call(command, ...args) as Promise<RedisReply>,
  });
}

export const hasDistributedRateLimits = (): boolean => Boolean(redisUrl);

export async function closeRateLimitStore(): Promise<void> {
  if (!redisClient) return;
  await redisClient.quit();
  redisClient = null;
}
