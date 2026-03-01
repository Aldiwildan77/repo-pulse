import type { NotificationDelivery } from "../../core/entities/index.js";
import type { NotificationDeliveryRow } from "../../infrastructure/database/types.js";

export function toNotificationDelivery(row: NotificationDeliveryRow): NotificationDelivery {
  return {
    id: row.id,
    notifierLogId: row.notifier_log_id,
    notificationPlatform: row.notification_platform,
    providerMessageId: row.provider_message_id,
    providerChannelId: row.provider_channel_id,
    providerThreadId: row.provider_thread_id,
    providerGuildId: row.provider_guild_id,
    providerResponse: row.provider_response,
    deliveredAt: row.delivered_at,
    editedAt: row.edited_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
