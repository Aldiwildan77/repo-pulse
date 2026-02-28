import type { FastifyInstance } from "fastify";
import type { Kysely } from "kysely";
import type { Redis } from "ioredis";
import { sql } from "kysely";
import type { Database } from "../infrastructure/database/types.js";

interface ServiceStatus {
  status: "up" | "down";
  latencyMs: number;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
  };
}

export class HealthHandler {
  constructor(
    private readonly db: Kysely<Database>,
    private readonly redis: Redis,
  ) {}

  register(app: FastifyInstance): void {
    app.get("/api/health", async (_request, reply) => {
      const [database, redis] = await Promise.all([
        this.checkDatabase(),
        this.checkRedis(),
      ]);

      const allUp = database.status === "up" && redis.status === "up";
      const allDown = database.status === "down" && redis.status === "down";

      const status: HealthResponse["status"] = allUp
        ? "healthy"
        : allDown
          ? "unhealthy"
          : "degraded";

      const response: HealthResponse = {
        status,
        timestamp: new Date().toISOString(),
        services: { database, redis },
      };

      const httpStatus = status === "unhealthy" ? 503 : 200;
      return reply.status(httpStatus).send(response);
    });
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    const start = performance.now();
    try {
      await sql`SELECT 1`.execute(this.db);
      return { status: "up", latencyMs: Math.round(performance.now() - start) };
    } catch {
      return { status: "down", latencyMs: Math.round(performance.now() - start) };
    }
  }

  private async checkRedis(): Promise<ServiceStatus> {
    const start = performance.now();
    try {
      await this.redis.ping();
      return { status: "up", latencyMs: Math.round(performance.now() - start) };
    } catch {
      return { status: "down", latencyMs: Math.round(performance.now() - start) };
    }
  }
}
