import { Redis } from "ioredis";

export type { Redis };

export function createRedisClient(redisUrl: string): Redis {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
}
