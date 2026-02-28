import type { NotifierLogRow } from "../../infrastructure/database/types.js";
import type { NotifierLog } from "../../core/entities/notifier-log.js";

export function toNotifierLog(row: NotifierLogRow): NotifierLog {
  return {
    id: row.id,
    repoConfigId: row.repo_config_id,
    eventType: row.event_type,
    status: row.status,
    platform: row.platform,
    summary: row.summary,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}
