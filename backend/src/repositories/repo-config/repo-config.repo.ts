import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { RepoConfigRepository } from "../../core/repositories/repo-config.repository.js";
import type { Platform, RepoConfig, RepoEventToggle, SourceProvider } from "../../core/entities/index.js";
import { toRepoConfig, toRepoEventToggle } from "./dto.js";

export class KyselyRepoConfigRepository implements RepoConfigRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async create(data: {
    userId: number;
    provider: SourceProvider;
    providerRepo: string;
    platform: Platform;
    channelId: string;
    tag?: string | null;
  }): Promise<RepoConfig> {
    const row = await this.db
      .insertInto("repo_configs")
      .values({
        user_id: data.userId,
        provider: data.provider,
        provider_repo: data.providerRepo,
        platform: data.platform,
        channel_id: data.channelId,
        tag: data.tag ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toRepoConfig(row);
  }

  async findById(id: number): Promise<RepoConfig | null> {
    const row = await this.db
      .selectFrom("repo_configs")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return row ? toRepoConfig(row) : null;
  }

  async findAllByUser(userId: number): Promise<RepoConfig[]> {
    const rows = await this.db
      .selectFrom("repo_configs")
      .selectAll()
      .where("user_id", "=", userId)
      .orderBy("created_at", "desc")
      .execute();

    return rows.map(toRepoConfig);
  }

  async findAllByUserPaginated(userId: number, limit: number, offset: number): Promise<{ configs: RepoConfig[]; total: number }> {
    const [rows, countResult] = await Promise.all([
      this.db
        .selectFrom("repo_configs")
        .selectAll()
        .where("user_id", "=", userId)
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset)
        .execute(),
      this.db
        .selectFrom("repo_configs")
        .select(this.db.fn.countAll().as("count"))
        .where("user_id", "=", userId)
        .executeTakeFirstOrThrow(),
    ]);

    return {
      configs: rows.map(toRepoConfig),
      total: Number(countResult.count),
    };
  }

  async findByRepo(providerRepo: string): Promise<RepoConfig[]> {
    const rows = await this.db
      .selectFrom("repo_configs")
      .selectAll()
      .where("provider_repo", "=", providerRepo)
      .execute();

    return rows.map(toRepoConfig);
  }

  async findActiveByRepo(providerRepo: string): Promise<RepoConfig[]> {
    const rows = await this.db
      .selectFrom("repo_configs")
      .selectAll()
      .where("provider_repo", "=", providerRepo)
      .where("is_active", "=", true)
      .execute();

    return rows.map(toRepoConfig);
  }

  async update(id: number, data: {
    channelId?: string;
    isActive?: boolean;
    tag?: string | null;
  }): Promise<void> {
    const updates: Record<string, unknown> = { updated_at: new Date() };
    if (data.channelId !== undefined) updates.channel_id = data.channelId;
    if (data.isActive !== undefined) updates.is_active = data.isActive;
    if (data.tag !== undefined) updates.tag = data.tag;

    await this.db
      .updateTable("repo_configs")
      .set(updates)
      .where("id", "=", id)
      .execute();
  }

  async updateWebhookId(id: number, webhookId: string | null, webhookCreatedBy: number | null): Promise<void> {
    await this.db
      .updateTable("repo_configs")
      .set({
        webhook_id: webhookId,
        webhook_created_by: webhookCreatedBy,
        updated_at: new Date(),
      })
      .where("id", "=", id)
      .execute();
  }

  async delete(id: number): Promise<void> {
    await this.db
      .deleteFrom("repo_configs")
      .where("id", "=", id)
      .execute();
  }

  async getEventToggles(repoConfigId: number): Promise<RepoEventToggle[]> {
    const rows = await this.db
      .selectFrom("repo_event_toggles")
      .selectAll()
      .where("repo_config_id", "=", repoConfigId)
      .execute();

    return rows.map(toRepoEventToggle);
  }

  async upsertEventToggle(repoConfigId: number, eventType: string, isEnabled: boolean): Promise<void> {
    await this.db
      .insertInto("repo_event_toggles")
      .values({
        repo_config_id: repoConfigId,
        event_type: eventType,
        is_enabled: isEnabled,
      })
      .onConflict((oc) =>
        oc.columns(["repo_config_id", "event_type"]).doUpdateSet({
          is_enabled: isEnabled,
          updated_at: new Date(),
        }),
      )
      .execute();
  }

  async isEventEnabled(repoConfigId: number, eventType: string): Promise<boolean> {
    const row = await this.db
      .selectFrom("repo_event_toggles")
      .select("is_enabled")
      .where("repo_config_id", "=", repoConfigId)
      .where("event_type", "=", eventType)
      .executeTakeFirst();

    // Default to true if no row exists (opt-out model)
    return row ? row.is_enabled : true;
  }
}
