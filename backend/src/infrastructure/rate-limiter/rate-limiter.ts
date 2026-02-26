import type { Redis } from "ioredis";

const RATE_LIMIT_PREFIX = "ratelimit:";

export class RateLimiter {
  constructor(
    private readonly redis: Redis,
    private readonly maxRequests: number = 100,
    private readonly windowSeconds: number = 60,
  ) {}

  async isAllowed(key: string): Promise<boolean> {
    const redisKey = `${RATE_LIMIT_PREFIX}${key}`;
    const current = await this.redis.incr(redisKey);

    if (current === 1) {
      await this.redis.expire(redisKey, this.windowSeconds);
    }

    return current <= this.maxRequests;
  }
}
