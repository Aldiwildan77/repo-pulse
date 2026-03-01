import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { NotificationDeliveryRepository } from "../../core/repositories/notification-delivery.repository.js";
import type { NotificationDelivery, NotificationPlatform } from "../../core/entities/index.js";
import { toNotificationDelivery } from "./dto.js";

export class KyselyNotificationDeliveryRepository implements NotificationDeliveryRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async create(data: {
    notifierLogId: number;
    notificationPlatform: NotificationPlatform;
    providerMessageId?: string | null;
    providerChannelId?: string | null;
    providerThreadId?: string | null;
    providerGuildId?: string | null;
    providerResponse?: unknown | null;
    deliveredAt?: Date | null;
  }): Promise<NotificationDelivery> {
    const row = await this.db
      .insertInto("notification_deliveries")
      .values({
        notifier_log_id: data.notifierLogId,
        notification_platform: data.notificationPlatform,
        provider_message_id: data.providerMessageId ?? null,
        provider_channel_id: data.providerChannelId ?? null,
        provider_thread_id: data.providerThreadId ?? null,
        provider_guild_id: data.providerGuildId ?? null,
        provider_response: data.providerResponse ? JSON.stringify(data.providerResponse) : null,
        delivered_at: data.deliveredAt ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toNotificationDelivery(row);
  }

  async findByProviderEntity(providerEntityId: string, providerRepo: string): Promise<NotificationDelivery[]> {
    const rows = await this.db
      .selectFrom("notification_deliveries")
      .innerJoin("notifier_logs", "notifier_logs.id", "notification_deliveries.notifier_log_id")
      .innerJoin("repo_config_notifications", "repo_config_notifications.id", "notifier_logs.repo_config_notification_id")
      .innerJoin("repo_configs", "repo_configs.id", "repo_config_notifications.repo_config_id")
      .selectAll("notification_deliveries")
      .where("notifier_logs.provider_entity_id", "=", providerEntityId)
      .where("repo_configs.provider_repo", "=", providerRepo)
      .execute();

    return rows.map(toNotificationDelivery);
  }

  async updateDelivery(id: number, data: {
    editedAt?: Date | null;
    deletedAt?: Date | null;
  }): Promise<void> {
    const updates: Record<string, unknown> = { updated_at: new Date() };
    if (data.editedAt !== undefined) updates.edited_at = data.editedAt;
    if (data.deletedAt !== undefined) updates.deleted_at = data.deletedAt;

    await this.db
      .updateTable("notification_deliveries")
      .set(updates)
      .where("id", "=", id)
      .execute();
  }
}
