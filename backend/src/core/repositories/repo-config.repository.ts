import type { Platform, RepoConfig, RepoEventToggle, SourceProvider } from "../entities/index.js";

export interface RepoConfigRepository {
  create(data: {
    provider: SourceProvider;
    providerRepo: string;
    platform: Platform;
    channelId: string;
  }): Promise<RepoConfig>;

  findById(id: number): Promise<RepoConfig | null>;

  findAll(): Promise<RepoConfig[]>;

  findAllPaginated(limit: number, offset: number): Promise<{ configs: RepoConfig[]; total: number }>;

  findByRepo(providerRepo: string): Promise<RepoConfig[]>;

  findActiveByRepo(providerRepo: string): Promise<RepoConfig[]>;

  update(id: number, data: {
    channelId?: string;
    isActive?: boolean;
  }): Promise<void>;

  delete(id: number): Promise<void>;

  getEventToggles(repoConfigId: number): Promise<RepoEventToggle[]>;

  upsertEventToggle(repoConfigId: number, eventType: string, isEnabled: boolean): Promise<void>;

  isEventEnabled(repoConfigId: number, eventType: string): Promise<boolean>;
}
