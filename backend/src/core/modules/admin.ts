import type { Config } from "../../infrastructure/config.js";
import type { RepoConfigRepository } from "../repositories/repo-config.repository.js";
import type { NotifierLogRepository } from "../repositories/notifier-log.repository.js";
import type { Platform, RepoConfig, RepoEventToggle, NotifierLog } from "../entities/index.js";
import type { SourceProvider } from "../webhook/webhook-provider.js";
import type { Pusher, Guild, Channel } from "./pusher/pusher.interface.js";
import type { GitHubApiClient } from "../../infrastructure/auth/github-api.js";
import type { GitLabApiClient } from "../../infrastructure/auth/gitlab-api.js";
import type { AuthModule } from "./auth.js";

export interface ProviderRepo {
  provider: SourceProvider;
  providerRepo: string;
}

export class AdminModule {
  private authModule: AuthModule | null = null;

  constructor(
    private readonly config: Config,
    private readonly repoConfigRepo: RepoConfigRepository,
    private readonly notifierLogRepo: NotifierLogRepository,
    private readonly pushers: Map<Platform, Pusher>,
    private readonly githubApi: GitHubApiClient | null,
    private readonly gitlabApi: GitLabApiClient | null,
  ) {}

  setAuthModule(auth: AuthModule): void {
    this.authModule = auth;
  }

  private async populateTags(configs: RepoConfig[]): Promise<void> {
    if (configs.length === 0) return;
    const tagsMap = await this.repoConfigRepo.getTagsForConfigs(configs.map((c) => c.id));
    for (const cfg of configs) {
      cfg.tags = tagsMap.get(cfg.id) ?? [];
    }
  }

  async getRepoConfigById(id: number): Promise<RepoConfig | null> {
    const config = await this.repoConfigRepo.findById(id);
    if (config) await this.populateTags([config]);
    return config;
  }

  async getAllRepoConfigsByUser(userId: number): Promise<RepoConfig[]> {
    const configs = await this.repoConfigRepo.findAllByUser(userId);
    await this.populateTags(configs);
    return configs;
  }

  async getAllRepoConfigsByUserPaginated(userId: number, limit: number, offset: number): Promise<{ configs: RepoConfig[]; total: number }> {
    const result = await this.repoConfigRepo.findAllByUserPaginated(userId, limit, offset);
    await this.populateTags(result.configs);
    return result;
  }

  async createRepoConfig(data: {
    userId: number;
    provider: SourceProvider;
    providerRepo: string;
    platform: Platform;
    channelId: string;
    tags?: string[];
  }): Promise<RepoConfig> {
    const config = await this.repoConfigRepo.create(data);
    if (data.tags && data.tags.length > 0) {
      await this.repoConfigRepo.setTagsForConfig(config.id, data.tags);
      config.tags = data.tags;
    }
    return config;
  }

  async getRepoConfigs(providerRepo: string): Promise<RepoConfig[]> {
    return this.repoConfigRepo.findByRepo(providerRepo);
  }

  async updateRepoConfig(id: number, userId: number, data: {
    channelId?: string;
    isActive?: boolean;
    tags?: string[];
  }): Promise<void> {
    const config = await this.repoConfigRepo.findById(id);
    if (!config || config.userId !== userId) {
      throw new Error("Config not found");
    }
    const { tags, ...updateData } = data;
    await this.repoConfigRepo.update(id, updateData);
    if (tags !== undefined) {
      await this.repoConfigRepo.setTagsForConfig(id, tags);
    }
  }

  async updateRepoConfigWebhook(id: number, webhookId: string | null, webhookCreatedBy: number | null): Promise<void> {
    return this.repoConfigRepo.updateWebhookId(id, webhookId, webhookCreatedBy);
  }

  async deleteRepoConfig(id: number, userId: number): Promise<void> {
    const config = await this.repoConfigRepo.findById(id);
    if (!config || config.userId !== userId) {
      throw new Error("Config not found");
    }
    return this.repoConfigRepo.delete(id);
  }

  async getEventToggles(repoConfigId: number, userId: number): Promise<RepoEventToggle[]> {
    const config = await this.repoConfigRepo.findById(repoConfigId);
    if (!config || config.userId !== userId) {
      throw new Error("Config not found");
    }
    return this.repoConfigRepo.getEventToggles(repoConfigId);
  }

  async upsertEventToggle(repoConfigId: number, userId: number, eventType: string, isEnabled: boolean): Promise<void> {
    const config = await this.repoConfigRepo.findById(repoConfigId);
    if (!config || config.userId !== userId) {
      throw new Error("Config not found");
    }
    return this.repoConfigRepo.upsertEventToggle(repoConfigId, eventType, isEnabled);
  }

  async getNotifierLogs(
    repoConfigId: number,
    userId: number,
    limit: number,
    offset: number,
  ): Promise<{ logs: NotifierLog[]; total: number }> {
    const config = await this.repoConfigRepo.findById(repoConfigId);
    if (!config || config.userId !== userId) {
      throw new Error("Config not found");
    }
    return this.notifierLogRepo.findByRepoConfig(repoConfigId, limit, offset);
  }

  async getProviderRepos(userId: number, provider: SourceProvider): Promise<ProviderRepo[]> {
    if (!this.authModule) throw new Error("Auth module not initialized");

    if (provider === "github") {
      if (!this.githubApi) return [];
      const token = await this.authModule.getGithubTokenForUser(userId);
      const repos = await this.githubApi.listUserRepos(token);
      return repos.map((r) => ({ provider: "github" as const, providerRepo: r.fullName }));
    }

    if (provider === "gitlab") {
      if (!this.gitlabApi) return [];
      const token = await this.authModule.getGitlabTokenForUser(userId);
      const projects = await this.gitlabApi.listUserProjects(token);
      return projects.map((p) => ({ provider: "gitlab" as const, providerRepo: p.pathWithNamespace }));
    }

    return [];
  }

  getProviderInstallUrl(provider: SourceProvider): string | null {
    if (provider === "github") {
      const slug = this.config.githubAppSlug;
      if (!slug) return null;
      return `https://github.com/apps/${slug}/installations/new`;
    }
    if (provider === "gitlab") {
      if (!this.config.gitlabClientId) return null;
      return `/api/auth/gitlab`;
    }
    return null;
  }

  async getDiscordGuilds(): Promise<Guild[]> {
    const discord = this.pushers.get("discord");
    if (!discord?.listGuilds) throw new Error("Discord pusher not available");
    return discord.listGuilds();
  }

  async getDiscordChannels(guildId: string): Promise<Channel[]> {
    const discord = this.pushers.get("discord");
    if (!discord) throw new Error("Discord pusher not available");
    return discord.listChannels(guildId);
  }

  async getSlackChannels(): Promise<Channel[]> {
    const slack = this.pushers.get("slack");
    if (!slack) throw new Error("Slack pusher not available");
    return slack.listChannels();
  }

  getDiscordBotInviteUrl(): string {
    const clientId = this.config.discordClientId;
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=2147534848&scope=bot`;
  }
}
