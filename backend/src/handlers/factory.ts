import type { FastifyInstance } from "fastify";
import type { Config } from "../infrastructure/config.js";
import type { ModuleFactory } from "../core/modules/factory.js";
import type { InfrastructureFactory } from "../infrastructure/factory.js";
import { WebhookHandler } from "./webhook.handler.js";
import { AuthHandler } from "./auth.handler.js";
import { AdminHandler } from "./admin.handler.js";
import { HealthHandler } from "./health.handler.js";
import { AuthMiddleware } from "./middleware/auth.middleware.js";

export class HandlerFactory {
  readonly webhook: WebhookHandler;
  readonly auth: AuthHandler;
  readonly admin: AdminHandler;
  readonly health: HealthHandler;

  constructor(config: Config, modules: ModuleFactory, infra: InfrastructureFactory) {
    const authMiddleware = new AuthMiddleware(modules.auth);

    this.webhook = new WebhookHandler(
      modules.notifier,
      infra.idempotency,
      config.githubWebhookSecret,
      infra.logger,
    );
    this.auth = new AuthHandler(modules.auth, config, authMiddleware);
    this.admin = new AdminHandler(modules.admin, authMiddleware);
    this.health = new HealthHandler();
  }

  registerAll(app: FastifyInstance): void {
    this.health.register(app);
    this.webhook.register(app);
    this.auth.register(app);
    this.admin.register(app);
  }
}
