import type { RepoConfig, RepoEventToggle } from "../../core/entities/index.js";
import type { RepoConfigRow, RepoEventToggleRow } from "../../infrastructure/database/types.js";

export function toRepoConfig(row: RepoConfigRow): RepoConfig {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerRepo: row.provider_repo,
    platform: row.platform,
    channelId: row.channel_id,
    tags: [],
    isActive: row.is_active,
    webhookId: row.webhook_id,
    webhookCreatedBy: row.webhook_created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toRepoEventToggle(row: RepoEventToggleRow): RepoEventToggle {
  return {
    id: row.id,
    repoConfigId: row.repo_config_id,
    eventType: row.event_type,
    isEnabled: row.is_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
