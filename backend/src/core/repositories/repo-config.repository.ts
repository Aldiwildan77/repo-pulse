import type { Platform, RepoConfig } from "../entities/index.js";

export interface RepoConfigRepository {
  create(data: {
    providerRepo: string;
    platform: Platform;
    channelId: string;
  }): Promise<RepoConfig>;

  findAll(): Promise<RepoConfig[]>;

  findByRepo(providerRepo: string): Promise<RepoConfig[]>;

  findActiveByRepo(providerRepo: string): Promise<RepoConfig[]>;

  update(id: number, data: { channelId?: string; isActive?: boolean }): Promise<void>;

  delete(id: number): Promise<void>;
}
