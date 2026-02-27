import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { RepoConfigRepository } from "../../core/repositories/repo-config.repository.js";
import type { Platform, RepoConfig, SourceProvider } from "../../core/entities/index.js";
import { toRepoConfig } from "./dto.js";

export class KyselyRepoConfigRepository implements RepoConfigRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async create(data: {
    provider: SourceProvider;
    providerRepo: string;
    platform: Platform;
    channelId: string;
  }): Promise<RepoConfig> {
    const row = await this.db
      .insertInto("repo_configs")
      .values({
        provider: data.provider,
        provider_repo: data.providerRepo,
        platform: data.platform,
        channel_id: data.channelId,
      })
      .onConflict((oc) =>
        oc.columns(["provider", "provider_repo", "platform"]).doUpdateSet({
          channel_id: data.channelId,
          is_active: true,
          updated_at: new Date(),
        }),
      )
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

  async findAll(): Promise<RepoConfig[]> {
    const rows = await this.db
      .selectFrom("repo_configs")
      .selectAll()
      .orderBy("created_at", "desc")
      .execute();

    return rows.map(toRepoConfig);
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

  async update(id: number, data: { channelId?: string; isActive?: boolean }): Promise<void> {
    const updates: Record<string, unknown> = { updated_at: new Date() };
    if (data.channelId !== undefined) updates.channel_id = data.channelId;
    if (data.isActive !== undefined) updates.is_active = data.isActive;

    await this.db
      .updateTable("repo_configs")
      .set(updates)
      .where("id", "=", id)
      .execute();
  }

  async delete(id: number): Promise<void> {
    await this.db
      .deleteFrom("repo_configs")
      .where("id", "=", id)
      .execute();
  }
}
