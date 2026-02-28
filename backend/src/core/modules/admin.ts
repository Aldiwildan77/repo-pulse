import type { Config } from "../../infrastructure/config.js";
import type { RepoConfigRepository } from "../repositories/repo-config.repository.js";
import type { ConnectedRepoRepository } from "../repositories/connected-repo.repository.js";
import type { NotifierLogRepository } from "../repositories/notifier-log.repository.js";
import type { Platform, RepoConfig, RepoEventToggle, ConnectedRepo, NotifierLog } from "../entities/index.js";
import type { SourceProvider } from "../webhook/webhook-provider.js";
import type { Pusher, Guild, Channel } from "./pusher/pusher.interface.js";

export class AdminModule {
  constructor(
    private readonly config: Config,
    private readonly repoConfigRepo: RepoConfigRepository,
    private readonly connectedRepoRepo: ConnectedRepoRepository,
    private readonly notifierLogRepo: NotifierLogRepository,
    private readonly pushers: Map<Platform, Pusher>,
  ) {}

  async getRepoConfigById(id: number): Promise<RepoConfig | null> {
    return this.repoConfigRepo.findById(id);
  }

  async getAllRepoConfigs(): Promise<RepoConfig[]> {
    return this.repoConfigRepo.findAll();
  }

  async createRepoConfig(data: {
    provider: SourceProvider;
    providerRepo: string;
    platform: Platform;
    channelId: string;
  }): Promise<RepoConfig> {
    return this.repoConfigRepo.create(data);
  }

  async getRepoConfigs(providerRepo: string): Promise<RepoConfig[]> {
    return this.repoConfigRepo.findByRepo(providerRepo);
  }

  async updateRepoConfig(id: number, data: {
    channelId?: string;
    isActive?: boolean;
  }): Promise<void> {
    return this.repoConfigRepo.update(id, data);
  }

  async deleteRepoConfig(id: number): Promise<void> {
    return this.repoConfigRepo.delete(id);
  }

  async getEventToggles(repoConfigId: number): Promise<RepoEventToggle[]> {
    return this.repoConfigRepo.getEventToggles(repoConfigId);
  }

  async upsertEventToggle(repoConfigId: number, eventType: string, isEnabled: boolean): Promise<void> {
    return this.repoConfigRepo.upsertEventToggle(repoConfigId, eventType, isEnabled);
  }

  async getNotifierLogs(
    repoConfigId: number,
    limit: number,
    offset: number,
  ): Promise<{ logs: NotifierLog[]; total: number }> {
    return this.notifierLogRepo.findByRepoConfig(repoConfigId, limit, offset);
  }

  async getConnectedRepos(userId: string): Promise<ConnectedRepo[]> {
    return this.connectedRepoRepo.findByUser(userId);
  }

  getProviderInstallUrl(provider: SourceProvider): string | null {
    if (provider === "github") {
      const slug = this.config.githubAppSlug;
      if (!slug) return null;
      return `https://github.com/apps/${slug}/installations/new`;
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
