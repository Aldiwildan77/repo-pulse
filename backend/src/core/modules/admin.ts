import type { Config } from "../../infrastructure/config.js";
import type { RepoConfigRepository } from "../repositories/repo-config.repository.js";
import type { RepoConfigNotificationRepository } from "../repositories/repo-config-notification.repository.js";
import type { WorkspaceRepository } from "../repositories/workspace.repository.js";
import type { NotifierLogRepository } from "../repositories/notifier-log.repository.js";
import type { NotificationPlatform, RepoConfig, RepoConfigNotification, RepoEventToggle, NotifierLog } from "../entities/index.js";
import type { SourceProvider } from "../webhook/webhook-provider.js";
import type { Pusher, Guild, Channel } from "./pusher/pusher.interface.js";
import type { GitHubApiClient } from "../../infrastructure/auth/github-api.js";
import type { GitLabApiClient } from "../../infrastructure/auth/gitlab-api.js";
import type { AuthModule } from "./auth.js";

export interface ProviderRepo {
  provider: SourceProvider;
  providerRepo: string;
}

export interface RepoConfigWithNotifications extends RepoConfig {
  notifications: RepoConfigNotification[];
}

export class AdminModule {
  private authModule: AuthModule | null = null;

  constructor(
    private readonly config: Config,
    private readonly repoConfigRepo: RepoConfigRepository,
    private readonly repoConfigNotificationRepo: RepoConfigNotificationRepository,
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly notifierLogRepo: NotifierLogRepository,
    private readonly pushers: Map<NotificationPlatform, Pusher>,
    private readonly githubApi: GitHubApiClient | null,
    private readonly gitlabApi: GitLabApiClient | null,
  ) {}

  setAuthModule(auth: AuthModule): void {
    this.authModule = auth;
  }

  private async populateNotifications(configs: RepoConfig[]): Promise<RepoConfigWithNotifications[]> {
    const result: RepoConfigWithNotifications[] = [];
    for (const cfg of configs) {
      const notifications = await this.repoConfigNotificationRepo.findByRepoConfig(cfg.id);
      const tagMap = await this.repoConfigNotificationRepo.getTagsForNotifications(notifications.map((n) => n.id));
      for (const notif of notifications) {
        notif.tags = tagMap.get(notif.id) ?? [];
      }
      result.push({ ...cfg, notifications });
    }
    return result;
  }

  async getRepoConfigById(id: number): Promise<RepoConfigWithNotifications | null> {
    const config = await this.repoConfigRepo.findById(id);
    if (!config) return null;
    const [result] = await this.populateNotifications([config]);
    return result;
  }

  async getRepoConfigsByWorkspace(workspaceId: number): Promise<RepoConfigWithNotifications[]> {
    const configs = await this.repoConfigRepo.findByWorkspace(workspaceId);
    return this.populateNotifications(configs);
  }

  async getRepoConfigsByWorkspacePaginated(workspaceId: number, limit: number, offset: number): Promise<{ configs: RepoConfigWithNotifications[]; total: number }> {
    const result = await this.repoConfigRepo.findByWorkspacePaginated(workspaceId, limit, offset);
    const configs = await this.populateNotifications(result.configs);
    return { configs, total: result.total };
  }

  async createRepoConfig(data: {
    workspaceId: number;
    providerType: SourceProvider;
    providerRepo: string;
    claimedByUserId: number;
    notifications?: { platform: NotificationPlatform; channelId: string; tags?: string[] }[];
  }): Promise<RepoConfigWithNotifications> {
    const config = await this.repoConfigRepo.create({
      workspaceId: data.workspaceId,
      providerType: data.providerType,
      providerRepo: data.providerRepo,
      claimedByUserId: data.claimedByUserId,
    });

    const notifications: RepoConfigNotification[] = [];
    if (data.notifications) {
      for (const n of data.notifications) {
        const notif = await this.repoConfigNotificationRepo.create({
          repoConfigId: config.id,
          notificationPlatform: n.platform,
          channelId: n.channelId,
        });
        if (n.tags && n.tags.length > 0) {
          await this.repoConfigNotificationRepo.setTagsForNotification(notif.id, n.tags);
          notif.tags = n.tags;
        }
        notifications.push(notif);
      }
    }

    return { ...config, notifications };
  }

  async createNotification(repoConfigId: number, data: {
    platform: NotificationPlatform;
    channelId: string;
    tags?: string[];
  }): Promise<RepoConfigNotification> {
    const notif = await this.repoConfigNotificationRepo.create({
      repoConfigId,
      notificationPlatform: data.platform,
      channelId: data.channelId,
    });
    if (data.tags && data.tags.length > 0) {
      await this.repoConfigNotificationRepo.setTagsForNotification(notif.id, data.tags);
      notif.tags = data.tags;
    }
    return notif;
  }

  async updateNotification(notificationId: number, data: {
    channelId?: string;
    isActive?: boolean;
    tags?: string[];
  }): Promise<void> {
    const { tags, ...updateData } = data;
    if (Object.keys(updateData).length > 0) {
      await this.repoConfigNotificationRepo.update(notificationId, updateData);
    }
    if (tags !== undefined) {
      await this.repoConfigNotificationRepo.setTagsForNotification(notificationId, tags);
    }
  }

  async deleteNotification(notificationId: number): Promise<void> {
    await this.repoConfigNotificationRepo.delete(notificationId);
  }

  async updateRepoConfig(id: number, workspaceId: number, data: {
    isActive?: boolean;
  }): Promise<void> {
    const config = await this.repoConfigRepo.findById(id);
    if (!config || config.workspaceId !== workspaceId) {
      throw new Error("Config not found");
    }
    await this.repoConfigRepo.update(id, data);
  }

  async deleteRepoConfig(id: number, workspaceId: number): Promise<void> {
    const config = await this.repoConfigRepo.findById(id);
    if (!config || config.workspaceId !== workspaceId) {
      throw new Error("Config not found");
    }
    return this.repoConfigRepo.delete(id);
  }

  async getEventToggles(notificationId: number): Promise<RepoEventToggle[]> {
    return this.repoConfigNotificationRepo.getEventToggles(notificationId);
  }

  async upsertEventToggle(notificationId: number, eventType: string, isEnabled: boolean): Promise<void> {
    return this.repoConfigNotificationRepo.upsertEventToggle(notificationId, eventType, isEnabled);
  }

  async getNotifierLogs(
    notificationId: number,
    limit: number,
    offset: number,
  ): Promise<{ logs: NotifierLog[]; total: number }> {
    return this.notifierLogRepo.findByNotification(notificationId, limit, offset);
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
