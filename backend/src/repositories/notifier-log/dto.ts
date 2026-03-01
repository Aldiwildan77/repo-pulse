import type { NotifierLogRow } from "../../infrastructure/database/types.js";
import type { NotifierLog } from "../../core/entities/notifier-log.js";

export function toNotifierLog(row: NotifierLogRow): NotifierLog {
  return {
    id: row.id,
    repoConfigNotificationId: row.repo_config_notification_id,
    eventType: row.event_type,
    status: row.status,
    platform: row.platform,
    providerEntityType: row.provider_entity_type,
    providerEntityId: row.provider_entity_id,
    providerEntityNumber: row.provider_entity_number,
    summary: row.summary,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
  };
}
