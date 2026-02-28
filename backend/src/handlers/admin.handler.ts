import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { AdminModule } from "../core/modules/admin.js";
import type { AuthModule } from "../core/modules/auth.js";
import type { Config } from "../infrastructure/config.js";
import type { GitLabApiClient } from "../infrastructure/auth/gitlab-api.js";
import type { Platform } from "../core/entities/index.js";
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

    app.get<{ Params: { id: string } }>("/api/repos/config/:id/toggles", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.getEventToggles.bind(this),
    });

    app.put("/api/repos/config/:id/toggles", {
      preHandler: this.authMiddleware.preHandler,
      handler: this.upsertEventToggle.bind(this),
    });

    app.get("/api/repos/config/:id/logs", {
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

  private async getAllConfigs(
    request: FastifyRequest<{
      Querystring: { limit?: string; offset?: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const query = request.query as Record<string, string>;
    const limitParam = query.limit;
    const offsetParam = query.offset;

    if (limitParam || offsetParam) {
      const limit = Math.min(parseInt(limitParam ?? "20", 10), 100);
      const offset = parseInt(offsetParam ?? "0", 10);
      const result = await this.admin.getAllRepoConfigsPaginated(limit, offset);
      reply.send(result);
      return;
    }

    const configs = await this.admin.getAllRepoConfigs();
    reply.send(configs);
  }

  private async createConfig(
    request: FastifyRequest<{
      Body: { provider: SourceProvider; providerRepo: string; platform: Platform; channelId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { provider, providerRepo, platform, channelId } = request.body;
    const userId = parseInt(request.userId!, 10);

    const config = await this.admin.createRepoConfig({ provider, providerRepo, platform, channelId });

    if (provider === "gitlab" && this.config.gitlabWebhookSecret) {
      try {
        const accessToken = await this.auth.getGitlabTokenForUser(userId);
        const webhookUrl = this.getGitlabWebhookUrl();
        const hookId = await this.gitlabApi.createProjectHook(
          accessToken,
          providerRepo,
          webhookUrl,
          this.config.gitlabWebhookSecret,
          { merge_requests_events: true, issues_events: true, note_events: true },
        );
        await this.admin.updateRepoConfigWebhook(config.id, String(hookId), userId);
        config.webhookId = String(hookId);
        config.webhookCreatedBy = userId;
      } catch {
        // Webhook creation failed but config was still created
      }
    }

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
      Body: {
        channelId?: string;
        isActive?: boolean;
      };
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
    const userId = parseInt(request.userId!, 10);

    const config = await this.admin.getRepoConfigById(id);

    if (config?.webhookId && config.provider === "gitlab" && config.webhookCreatedBy) {
      try {
        const tokenUserId = config.webhookCreatedBy ?? userId;
        const accessToken = await this.auth.getGitlabTokenForUser(tokenUserId);
        await this.gitlabApi.deleteProjectHook(
          accessToken,
          config.providerRepo,
          parseInt(config.webhookId, 10),
        );
      } catch {
        // Webhook deletion failed, still proceed with config deletion
      }
    }

    await this.admin.deleteRepoConfig(id);
    reply.code(204).send();
  }

  private async getEventToggles(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const id = parseInt(request.params.id, 10);
    const toggles = await this.admin.getEventToggles(id);
    reply.send(toggles);
  }

  private async upsertEventToggle(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { eventType: string; isEnabled: boolean };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const id = parseInt(request.params.id, 10);
    const { eventType, isEnabled } = request.body;
    await this.admin.upsertEventToggle(id, eventType, isEnabled);
    reply.code(204).send();
  }

  private async getNotifierLogs(
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { limit?: string; offset?: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const id = parseInt(request.params.id, 10);
    const limit = Math.min(parseInt((request.query as Record<string, string>).limit ?? "50", 10), 100);
    const offset = parseInt((request.query as Record<string, string>).offset ?? "0", 10);
    const result = await this.admin.getNotifierLogs(id, limit, offset);
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
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = parseInt(request.userId!, 10);

    const identities = await this.auth.getIdentities(userId);
    const githubIdentity = identities.find((i) => i.provider === "github");

    if (!githubIdentity) {
      reply.send([]);
      return;
    }

    const repos = await this.admin.getConnectedRepos(githubIdentity.providerUserId);
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

  private getGitlabWebhookUrl(): string {
    const callbackUrl = this.config.gitlabCallbackUrl;
    if (callbackUrl) {
      const origin = new URL(callbackUrl).origin;
      return `${origin}/api/webhook/gitlab`;
    }
    return `${this.config.frontendUrl}/api/webhook/gitlab`;
  }
}
