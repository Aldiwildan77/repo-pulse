import type { RepoConfig } from "../../core/entities/index.js";
import type { RepoConfigRow } from "../../infrastructure/database/types.js";

export function toRepoConfig(row: RepoConfigRow): RepoConfig {
  return {
    id: row.id,
    providerRepo: row.provider_repo,
    platform: row.platform,
    channelId: row.channel_id,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
