import type { FastifyInstance } from "fastify";

export class HealthHandler {
  register(app: FastifyInstance): void {
    app.get("/api/health", async () => {
      return { status: "ok", timestamp: new Date().toISOString() };
    });
  }
}
