import type { RepoConfig } from "../../core/entities/index.js";
import type { RepoConfigRow } from "../../infrastructure/database/types.js";

export function toRepoConfig(row: RepoConfigRow): RepoConfig {
  return {
    id: row.id,
    provider: row.provider,
    providerRepo: row.provider_repo,
    platform: row.platform,
    channelId: row.channel_id,
    isActive: row.is_active,
    notifyPrOpened: row.notify_pr_opened,
    notifyPrMerged: row.notify_pr_merged,
    notifyPrLabel: row.notify_pr_label,
    notifyComment: row.notify_comment,
    notifyIssueOpened: row.notify_issue_opened,
    notifyIssueClosed: row.notify_issue_closed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
