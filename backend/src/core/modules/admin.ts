import type { Config } from "../../infrastructure/config.js";
import type { RepoConfigRepository } from "../repositories/repo-config.repository.js";
import type { ConnectedRepoRepository } from "../repositories/connected-repo.repository.js";
import type { Platform, RepoConfig, ConnectedRepo } from "../entities/index.js";
import type { SourceProvider } from "../webhook/webhook-provider.js";

export class AdminModule {
  constructor(
    private readonly config: Config,
    private readonly repoConfigRepo: RepoConfigRepository,
    private readonly connectedRepoRepo: ConnectedRepoRepository,
  ) {}

  async getRepoConfigById(id: number): Promise<RepoConfig | null> {
    return this.repoConfigRepo.findById(id);
  }

  async getAllRepoConfigs(): Promise<RepoConfig[]> {
    return this.repoConfigRepo.findAll();
  }

  async createRepoConfig(data: {
    providerRepo: string;
    platform: Platform;
    channelId: string;
  }): Promise<RepoConfig> {
    return this.repoConfigRepo.create(data);
  }

  async getRepoConfigs(providerRepo: string): Promise<RepoConfig[]> {
    return this.repoConfigRepo.findByRepo(providerRepo);
  }

  async updateRepoConfig(id: number, data: { channelId?: string; isActive?: boolean }): Promise<void> {
    return this.repoConfigRepo.update(id, data);
  }

  async deleteRepoConfig(id: number): Promise<void> {
    return this.repoConfigRepo.delete(id);
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
}
