import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { ConnectedRepoRepository } from "../../core/repositories/connected-repo.repository.js";
import type { ConnectedRepo } from "../../core/entities/connected-repo.js";
import type { SourceProvider } from "../../core/webhook/webhook-provider.js";
import { toConnectedRepo } from "./dto.js";

export class KyselyConnectedRepoRepository implements ConnectedRepoRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async addRepos(repos: Omit<ConnectedRepo, "id" | "createdAt">[]): Promise<void> {
    if (repos.length === 0) return;

    await this.db
      .insertInto("connected_repos")
      .values(
        repos.map((r) => ({
          provider: r.provider,
          provider_installation_id: r.providerInstallationId,
          provider_repo: r.providerRepo,
          connected_by: r.connectedBy,
        })),
      )
      .onConflict((oc) => oc.columns(["provider", "provider_repo"]).doNothing())
      .execute();
  }

  async removeByInstallation(provider: SourceProvider, installationId: string): Promise<void> {
    await this.db
      .deleteFrom("connected_repos")
      .where("provider", "=", provider)
      .where("provider_installation_id", "=", installationId)
      .execute();
  }

  async removeRepos(repos: { provider: SourceProvider; providerRepo: string }[]): Promise<void> {
    if (repos.length === 0) return;

    for (const repo of repos) {
      await this.db
        .deleteFrom("connected_repos")
        .where("provider", "=", repo.provider)
        .where("provider_repo", "=", repo.providerRepo)
        .execute();
    }
  }

  async findByUser(connectedBy: string): Promise<ConnectedRepo[]> {
    const rows = await this.db
      .selectFrom("connected_repos")
      .selectAll()
      .where("connected_by", "=", connectedBy)
      .orderBy("created_at", "desc")
      .execute();

    return rows.map(toConnectedRepo);
  }

  async findByRepo(provider: SourceProvider, providerRepo: string): Promise<ConnectedRepo | null> {
    const row = await this.db
      .selectFrom("connected_repos")
      .selectAll()
      .where("provider", "=", provider)
      .where("provider_repo", "=", providerRepo)
      .executeTakeFirst();

    return row ? toConnectedRepo(row) : null;
  }

  async findAll(): Promise<ConnectedRepo[]> {
    const rows = await this.db
      .selectFrom("connected_repos")
      .selectAll()
      .orderBy("created_at", "desc")
      .execute();

    return rows.map(toConnectedRepo);
  }
}
