import type { Config } from "../../infrastructure/config.js";
import type { RepoConfigRepository } from "../repositories/repo-config.repository.js";
import type { Platform, RepoConfig } from "../entities/index.js";

export class AdminModule {
  constructor(
    private readonly config: Config,
    private readonly repoConfigRepo: RepoConfigRepository,
  ) {}

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
}
