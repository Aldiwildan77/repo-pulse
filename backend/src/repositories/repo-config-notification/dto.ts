import type { RepoConfigNotification, RepoEventToggle } from "../../core/entities/index.js";
import type { RepoConfigNotificationRow, RepoEventToggleRow } from "../../infrastructure/database/types.js";

export function toRepoConfigNotification(row: RepoConfigNotificationRow): RepoConfigNotification {
  return {
    id: row.id,
    repoConfigId: row.repo_config_id,
    notificationPlatform: row.notification_platform,
    channelId: row.channel_id,
    guildId: row.guild_id ?? null,
    isActive: row.is_active,
    tags: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toRepoEventToggle(row: RepoEventToggleRow): RepoEventToggle {
  return {
    id: row.id,
    repoConfigNotificationId: row.repo_config_notification_id,
    eventType: row.event_type,
    isEnabled: row.is_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
