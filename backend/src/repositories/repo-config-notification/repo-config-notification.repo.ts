import { sql, type Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { RepoConfigNotificationRepository } from "../../core/repositories/repo-config-notification.repository.js";
import type { RepoConfigNotification, RepoEventToggle, NotificationPlatform } from "../../core/entities/index.js";
import { toRepoConfigNotification, toRepoEventToggle } from "./dto.js";

export class KyselyRepoConfigNotificationRepository implements RepoConfigNotificationRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async create(data: {
    repoConfigId: number;
    notificationPlatform: NotificationPlatform;
    channelId: string;
    guildId?: string | null;
  }): Promise<RepoConfigNotification> {
    const row = await this.db
      .insertInto("repo_config_notifications")
      .values({
        repo_config_id: data.repoConfigId,
        notification_platform: data.notificationPlatform,
        channel_id: data.channelId,
        guild_id: data.guildId ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toRepoConfigNotification(row);
  }

  async findById(id: number): Promise<RepoConfigNotification | null> {
    const row = await this.db
      .selectFrom("repo_config_notifications")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return row ? toRepoConfigNotification(row) : null;
  }

  async findByRepoConfig(repoConfigId: number): Promise<RepoConfigNotification[]> {
    const rows = await this.db
      .selectFrom("repo_config_notifications")
      .selectAll()
      .where("repo_config_id", "=", repoConfigId)
      .execute();

    return rows.map(toRepoConfigNotification);
  }

  async findActiveByRepoConfig(repoConfigId: number): Promise<RepoConfigNotification[]> {
    const rows = await this.db
      .selectFrom("repo_config_notifications")
      .selectAll()
      .where("repo_config_id", "=", repoConfigId)
      .where("is_active", "=", true)
      .execute();

    return rows.map(toRepoConfigNotification);
  }

  async findActiveByRepo(providerRepo: string): Promise<RepoConfigNotification[]> {
    const rows = await this.db
      .selectFrom("repo_config_notifications")
      .innerJoin("repo_configs", "repo_configs.id", "repo_config_notifications.repo_config_id")
      .selectAll("repo_config_notifications")
      .where(sql<string>`lower(${sql.ref("repo_configs.provider_repo")})`, "=", providerRepo.toLowerCase())
      .where("repo_configs.is_active", "=", true)
      .where("repo_config_notifications.is_active", "=", true)
      .execute();

    return rows.map(toRepoConfigNotification);
  }

  async update(id: number, data: { channelId?: string; guildId?: string | null; isActive?: boolean }): Promise<void> {
    const updates: Record<string, unknown> = { updated_at: new Date() };
    if (data.channelId !== undefined) updates.channel_id = data.channelId;
    if (data.guildId !== undefined) updates.guild_id = data.guildId;
    if (data.isActive !== undefined) updates.is_active = data.isActive;

    await this.db
      .updateTable("repo_config_notifications")
      .set(updates)
      .where("id", "=", id)
      .execute();
  }

  async delete(id: number): Promise<void> {
    await this.db
      .deleteFrom("repo_config_notifications")
      .where("id", "=", id)
      .execute();
  }

  async getTagsForNotifications(ids: number[]): Promise<Map<number, string[]>> {
    if (ids.length === 0) return new Map();

    const rows = await this.db
      .selectFrom("repo_config_notification_tags")
      .select(["repo_config_notification_id", "tag"])
      .where("repo_config_notification_id", "in", ids)
      .where("is_active", "=", true)
      .execute();

    const map = new Map<number, string[]>();
    for (const row of rows) {
      const existing = map.get(row.repo_config_notification_id) ?? [];
      existing.push(row.tag);
      map.set(row.repo_config_notification_id, existing);
    }
    return map;
  }

  async setTagsForNotification(id: number, tags: string[]): Promise<void> {
    await this.db
      .deleteFrom("repo_config_notification_tags")
      .where("repo_config_notification_id", "=", id)
      .execute();

    if (tags.length > 0) {
      await this.db
        .insertInto("repo_config_notification_tags")
        .values(tags.map((tag) => ({ repo_config_notification_id: id, tag })))
        .execute();
    }
  }

  async getEventToggles(notificationId: number): Promise<RepoEventToggle[]> {
    const rows = await this.db
      .selectFrom("repo_event_toggles")
      .selectAll()
      .where("repo_config_notification_id", "=", notificationId)
      .execute();

    return rows.map(toRepoEventToggle);
  }

  async upsertEventToggle(notificationId: number, eventType: string, isEnabled: boolean): Promise<void> {
    await this.db
      .insertInto("repo_event_toggles")
      .values({
        repo_config_notification_id: notificationId,
        event_type: eventType,
        is_enabled: isEnabled,
      })
      .onConflict((oc) =>
        oc.columns(["repo_config_notification_id", "event_type"]).doUpdateSet({
          is_enabled: isEnabled,
          updated_at: new Date(),
        }),
      )
      .execute();
  }

  async isEventEnabled(notificationId: number, eventType: string): Promise<boolean> {
    const row = await this.db
      .selectFrom("repo_event_toggles")
      .select("is_enabled")
      .where("repo_config_notification_id", "=", notificationId)
      .where("event_type", "=", eventType)
      .executeTakeFirst();

    return row ? row.is_enabled : true;
  }
}
