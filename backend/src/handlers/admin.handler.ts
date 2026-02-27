import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { AdminModule } from "../core/modules/admin.js";
import type { Platform } from "../core/entities/index.js";
import type { SourceProvider } from "../core/webhook/webhook-provider.js";
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

    app.get<{ Params: { id: string } }>("/api/repos/config/:id", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.getConfigById.bind(this),
    });

    app.patch("/api/repos/config/:id", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.updateConfig.bind(this),
    });

    app.delete("/api/repos/config/:id", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.deleteConfig.bind(this),
    });

    app.get<{ Params: { provider: string } }>("/api/providers/:provider/install", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.getProviderInstallUrl.bind(this),
    });

    app.get("/api/repos/connected", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.getConnectedRepos.bind(this),
    });

    app.get("/api/platforms/discord/guilds", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.getDiscordGuilds.bind(this),
    });

    app.get<{ Params: { guildId: string } }>("/api/platforms/discord/guilds/:guildId/channels", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.getDiscordChannels.bind(this),
    });

    app.get("/api/platforms/slack/channels", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.getSlackChannels.bind(this),
    });

    app.get("/api/platforms/discord/bot-invite", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.getDiscordBotInvite.bind(this),
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

  private async getConfigById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const id = parseInt(request.params.id, 10);
    const config = await this.admin.getRepoConfigById(id);
    if (!config) {
      reply.code(404).send({ error: "Config not found" });
      return;
    }
    reply.send(config);
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

  private async getProviderInstallUrl(
    request: FastifyRequest<{ Params: { provider: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const provider = request.params.provider as SourceProvider;
    const url = this.admin.getProviderInstallUrl(provider);

    if (!url) {
      reply.code(404).send({ error: "Install URL not available for this provider" });
      return;
    }

    reply.redirect(url);
  }

  private async getConnectedRepos(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = request.userId!;
    const repos = await this.admin.getConnectedRepos(userId);
    reply.send(repos);
  }

  private async getDiscordGuilds(
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const guilds = await this.admin.getDiscordGuilds();
    reply.send(guilds);
  }

  private async getDiscordChannels(
    request: FastifyRequest<{ Params: { guildId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { guildId } = request.params;
    const channels = await this.admin.getDiscordChannels(guildId);
    reply.send(channels);
  }

  private async getSlackChannels(
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const channels = await this.admin.getSlackChannels();
    reply.send(channels);
  }

  private async getDiscordBotInvite(
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const url = this.admin.getDiscordBotInviteUrl();
    reply.send({ url });
  }
}
