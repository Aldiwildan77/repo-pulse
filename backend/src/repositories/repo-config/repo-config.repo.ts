import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { RepoConfigRepository } from "../../core/repositories/repo-config.repository.js";
import type { RepoConfig, SourceProvider } from "../../core/entities/index.js";
import { toRepoConfig } from "./dto.js";

export class KyselyRepoConfigRepository implements RepoConfigRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async create(data: {
    workspaceId: number;
    providerType: SourceProvider;
    providerRepo: string;
    claimedByUserId?: number | null;
  }): Promise<RepoConfig> {
    const row = await this.db
      .insertInto("repo_configs")
      .values({
        workspace_id: data.workspaceId,
        provider_type: data.providerType,
        provider_repo: data.providerRepo,
        claimed_by_user_id: data.claimedByUserId ?? null,
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

  async findByWorkspace(workspaceId: number): Promise<RepoConfig[]> {
    const rows = await this.db
      .selectFrom("repo_configs")
      .selectAll()
      .where("workspace_id", "=", workspaceId)
      .orderBy("created_at", "desc")
      .execute();

    return rows.map(toRepoConfig);
  }

  async findByWorkspacePaginated(workspaceId: number, limit: number, offset: number): Promise<{ configs: RepoConfig[]; total: number }> {
    const [rows, countResult] = await Promise.all([
      this.db
        .selectFrom("repo_configs")
        .selectAll()
        .where("workspace_id", "=", workspaceId)
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset)
        .execute(),
      this.db
        .selectFrom("repo_configs")
        .select(this.db.fn.countAll().as("count"))
        .where("workspace_id", "=", workspaceId)
        .executeTakeFirstOrThrow(),
    ]);

    return {
      configs: rows.map(toRepoConfig),
      total: Number(countResult.count),
    };
  }

  async update(id: number, data: { isActive?: boolean }): Promise<void> {
    const updates: Record<string, unknown> = { updated_at: new Date() };
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
