import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { AdminModule } from "../core/modules/admin.js";
import type { Platform } from "../core/entities/index.js";
import type { AuthMiddleware } from "./middleware/auth.middleware.js";

export class AdminHandler {
  constructor(
    private readonly admin: AdminModule,
    private readonly authMiddleware: AuthMiddleware,
  ) {}

  register(app: FastifyInstance): void {
    app.get("/api/repos/config", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.getAllConfigs.bind(this),
    });

    app.post("/api/repos/config", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.createConfig.bind(this),
    });

    app.get("/api/repos/:repo/config", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.getConfigs.bind(this),
    });

    app.patch("/api/repos/config/:id", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.updateConfig.bind(this),
    });

    app.delete("/api/repos/config/:id", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.deleteConfig.bind(this),
    });
  }

  private async getAllConfigs(
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const configs = await this.admin.getAllRepoConfigs();
    reply.send(configs);
  }

  private async createConfig(
    request: FastifyRequest<{
      Body: { providerRepo: string; platform: Platform; channelId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { providerRepo, platform, channelId } = request.body;
    const config = await this.admin.createRepoConfig({ providerRepo, platform, channelId });
    reply.code(201).send(config);
  }

  private async getConfigs(
    request: FastifyRequest<{ Params: { repo: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const repo = decodeURIComponent(request.params.repo);
    const configs = await this.admin.getRepoConfigs(repo);
    reply.send(configs);
  }

  private async updateConfig(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { channelId?: string; isActive?: boolean };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const id = parseInt(request.params.id, 10);
    await this.admin.updateRepoConfig(id, request.body);
    reply.code(204).send();
  }

  private async deleteConfig(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const id = parseInt(request.params.id, 10);
    await this.admin.deleteRepoConfig(id);
    reply.code(204).send();
  }
}
