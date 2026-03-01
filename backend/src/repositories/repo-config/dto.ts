import type { RepoConfig } from "../../core/entities/index.js";
import type { RepoConfigRow } from "../../infrastructure/database/types.js";

export function toRepoConfig(row: RepoConfigRow): RepoConfig {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    providerRepo: row.provider_repo,
    providerType: row.provider_type,
    claimedByUserId: row.claimed_by_user_id,
    claimedAt: row.claimed_at,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
