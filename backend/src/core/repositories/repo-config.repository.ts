import type { Platform, RepoConfig, RepoEventToggle, SourceProvider } from "../entities/index.js";

export interface RepoConfigRepository {
  create(data: {
    userId: number;
    provider: SourceProvider;
    providerRepo: string;
    platform: Platform;
    channelId: string;
  }): Promise<RepoConfig>;

  findById(id: number): Promise<RepoConfig | null>;

  findAllByUser(userId: number): Promise<RepoConfig[]>;

  findAllByUserPaginated(userId: number, limit: number, offset: number): Promise<{ configs: RepoConfig[]; total: number }>;

  findByRepo(providerRepo: string): Promise<RepoConfig[]>;

  findActiveByRepo(providerRepo: string): Promise<RepoConfig[]>;

  update(id: number, data: {
    channelId?: string;
    isActive?: boolean;
  }): Promise<void>;

  updateWebhookId(id: number, webhookId: string | null, webhookCreatedBy: number | null): Promise<void>;

  delete(id: number): Promise<void>;

  getEventToggles(repoConfigId: number): Promise<RepoEventToggle[]>;

  upsertEventToggle(repoConfigId: number, eventType: string, isEnabled: boolean): Promise<void>;

  isEventEnabled(repoConfigId: number, eventType: string): Promise<boolean>;
}
