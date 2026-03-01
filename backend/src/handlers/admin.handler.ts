import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { AdminModule } from "../core/modules/admin.js";
import type { AuthModule } from "../core/modules/auth.js";
import type { Config } from "../infrastructure/config.js";
import type { GitLabApiClient } from "../infrastructure/auth/gitlab-api.js";
import type { NotificationPlatform } from "../core/entities/index.js";
import type { SourceProvider } from "../core/webhook/webhook-provider.js";
import type { AuthMiddleware } from "./middleware/auth.middleware.js";

export class AdminHandler {
  constructor(
    private readonly admin: AdminModule,
    private readonly auth: AuthModule,
    private readonly config: Config,
    private readonly gitlabApi: GitLabApiClient,
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

    // Notification-level endpoints
    app.post("/api/repos/config/:id/notifications", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.createNotification.bind(this),
    });

    app.patch("/api/repos/config/notifications/:notificationId", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.updateNotification.bind(this),
    });

    app.delete("/api/repos/config/notifications/:notificationId", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.deleteNotification.bind(this),
    });

    app.get<{ Params: { notificationId: string } }>("/api/repos/config/notifications/:notificationId/toggles", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.getEventToggles.bind(this),
    });

    app.put("/api/repos/config/notifications/:notificationId/toggles", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.upsertEventToggle.bind(this),
    });

    app.get("/api/repos/config/notifications/:notificationId/logs", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.getNotifierLogs.bind(this),
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

  private async getWorkspaceId(userId: number): Promise<number> {
    const workspaceId = await this.auth.getDefaultWorkspaceId(userId);
    if (!workspaceId) throw new Error("No workspace found");
    return workspaceId;
  }

  private async getAllConfigs(
    request: FastifyRequest<{
      Querystring: { limit?: string; offset?: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = parseInt(request.userId!, 10);
    const workspaceId = await this.getWorkspaceId(userId);
    const query = request.query as Record<string, string>;
    const limitParam = query.limit;
    const offsetParam = query.offset;

    if (limitParam || offsetParam) {
      const limit = Math.min(parseInt(limitParam ?? "20", 10), 100);
      const offset = parseInt(offsetParam ?? "0", 10);
      const result = await this.admin.getRepoConfigsByWorkspacePaginated(workspaceId, limit, offset);
      reply.send(result);
      return;
    }

    const configs = await this.admin.getRepoConfigsByWorkspace(workspaceId);
    reply.send(configs);
  }

  private async createConfig(
    request: FastifyRequest<{
      Body: {
        providerType: SourceProvider;
        providerRepo: string;
        notifications?: { platform: NotificationPlatform; channelId: string; tags?: string[] }[];
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { providerType, providerRepo, notifications } = request.body;
    const userId = parseInt(request.userId!, 10);
    const workspaceId = await this.getWorkspaceId(userId);

    const config = await this.admin.createRepoConfig({
      workspaceId,
      providerType,
      providerRepo,
      claimedByUserId: userId,
      notifications,
    });

    reply.code(201).send(config);
  }

  private async getConfigById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = parseInt(request.userId!, 10);
    const workspaceId = await this.getWorkspaceId(userId);
    const id = parseInt(request.params.id, 10);
    const config = await this.admin.getRepoConfigById(id);
    if (!config || config.workspaceId !== workspaceId) {
      reply.code(404).send({ error: "Config not found" });
      return;
    }
    reply.send(config);
  }

  private async updateConfig(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { isActive?: boolean };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = parseInt(request.userId!, 10);
    const workspaceId = await this.getWorkspaceId(userId);
    const id = parseInt(request.params.id, 10);
    await this.admin.updateRepoConfig(id, workspaceId, request.body);
    reply.code(204).send();
  }

  private async deleteConfig(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const id = parseInt(request.params.id, 10);
    const userId = parseInt(request.userId!, 10);
    const workspaceId = await this.getWorkspaceId(userId);

    await this.admin.deleteRepoConfig(id, workspaceId);
    reply.code(204).send();
  }

  private async createNotification(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { platform: NotificationPlatform; channelId: string; tags?: string[] };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const repoConfigId = parseInt(request.params.id, 10);
    const notif = await this.admin.createNotification(repoConfigId, request.body);
    reply.code(201).send(notif);
  }

  private async updateNotification(
    request: FastifyRequest<{
      Params: { notificationId: string };
      Body: { channelId?: string; isActive?: boolean; tags?: string[] };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const notificationId = parseInt(request.params.notificationId, 10);
    await this.admin.updateNotification(notificationId, request.body);
    reply.code(204).send();
  }

  private async deleteNotification(
    request: FastifyRequest<{ Params: { notificationId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const notificationId = parseInt(request.params.notificationId, 10);
    await this.admin.deleteNotification(notificationId);
    reply.code(204).send();
  }

  private async getEventToggles(
    request: FastifyRequest<{ Params: { notificationId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const notificationId = parseInt(request.params.notificationId, 10);
    const toggles = await this.admin.getEventToggles(notificationId);
    reply.send(toggles);
  }

  private async upsertEventToggle(
    request: FastifyRequest<{
      Params: { notificationId: string };
      Body: { eventType: string; isEnabled: boolean };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const notificationId = parseInt(request.params.notificationId, 10);
    const { eventType, isEnabled } = request.body;
    await this.admin.upsertEventToggle(notificationId, eventType, isEnabled);
    reply.code(204).send();
  }

  private async getNotifierLogs(
    request: FastifyRequest<{
      Params: { notificationId: string };
      Querystring: { limit?: string; offset?: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const notificationId = parseInt(request.params.notificationId, 10);
    const limit = Math.min(parseInt((request.query as Record<string, string>).limit ?? "50", 10), 100);
    const offset = parseInt((request.query as Record<string, string>).offset ?? "0", 10);
    const result = await this.admin.getNotifierLogs(notificationId, limit, offset);
    reply.send(result);
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
    request: FastifyRequest<{
      Querystring: { provider?: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = parseInt(request.userId!, 10);
    const provider = ((request.query as Record<string, string>).provider ?? "github") as SourceProvider;

    try {
      const repos = await this.admin.getProviderRepos(userId, provider);
      reply.send(repos);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch repositories";
      reply.code(400).send({ error: message });
    }
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
