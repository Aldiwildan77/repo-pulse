import type { Kysely } from "kysely";
import { sql } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { NotifierLogRepository } from "../../core/repositories/notifier-log.repository.js";
import type { NotifierLog, NotificationStatus, NotificationPlatform } from "../../core/entities/index.js";
import { toNotifierLog } from "./dto.js";

export class KyselyNotifierLogRepository implements NotifierLogRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async create(data: {
    repoConfigNotificationId: number;
    eventType: string;
    status: NotificationStatus;
    platform: NotificationPlatform;
    providerEntityType?: string;
    providerEntityId: string;
    providerEntityNumber?: number | null;
    summary: string;
    errorMessage?: string | null;
    resolvedAt?: Date | null;
  }): Promise<NotifierLog> {
    const row = await this.db
      .insertInto("notifier_logs")
      .values({
        repo_config_notification_id: data.repoConfigNotificationId,
        event_type: data.eventType,
        status: data.status,
        platform: data.platform,
        provider_entity_type: data.providerEntityType ?? "pull_request",
        provider_entity_id: data.providerEntityId,
        provider_entity_number: data.providerEntityNumber ?? null,
        summary: data.summary,
        error_message: data.errorMessage ?? null,
        resolved_at: data.resolvedAt ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toNotifierLog(row);
  }

  async findByNotification(
    notificationId: number,
    limit: number,
    offset: number,
  ): Promise<{ logs: NotifierLog[]; total: number }> {
    const [rows, countResult] = await Promise.all([
      this.db
        .selectFrom("notifier_logs")
        .selectAll()
        .where("repo_config_notification_id", "=", notificationId)
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset)
        .execute(),
      this.db
        .selectFrom("notifier_logs")
        .select(sql<number>`count(*)::int`.as("count"))
        .where("repo_config_notification_id", "=", notificationId)
        .executeTakeFirstOrThrow(),
    ]);

    return {
      logs: rows.map(toNotifierLog),
      total: countResult.count,
    };
  }

  async updateStatus(id: number, status: NotificationStatus, resolvedAt?: Date | null): Promise<void> {
    await this.db
      .updateTable("notifier_logs")
      .set({
        status,
        resolved_at: resolvedAt ?? null,
        updated_at: new Date(),
      })
      .where("id", "=", id)
      .execute();
  }
}
