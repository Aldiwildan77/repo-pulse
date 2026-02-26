import type { Redis } from "ioredis";

const IDEMPOTENCY_PREFIX = "idempotency:";
const DEFAULT_TTL_SECONDS = 86400; // 24 hours

export class IdempotencyStore {
  constructor(
    private readonly redis: Redis,
    private readonly ttlSeconds: number = DEFAULT_TTL_SECONDS,
  ) {}

  async isDuplicate(eventId: string): Promise<boolean> {
    const key = `${IDEMPOTENCY_PREFIX}${eventId}`;
    const result = await this.redis.set(key, "1", "EX", this.ttlSeconds, "NX");
    // SET NX returns "OK" if the key was set (new event), null if it already existed (duplicate)
    return result === null;
  }
}
