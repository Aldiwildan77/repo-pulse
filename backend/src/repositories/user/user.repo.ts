import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { UserRepository } from "../../core/repositories/user.repository.js";
import type { User } from "../../core/entities/index.js";
import { toUser } from "./dto.js";

export class KyselyUserRepository implements UserRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async createUser(): Promise<User> {
    const row = await this.db
      .insertInto("users")
      .values({})
      .returningAll()
      .executeTakeFirstOrThrow();

    return toUser(row);
  }

  async findById(id: number): Promise<User | null> {
    const row = await this.db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return row ? toUser(row) : null;
  }

  async findByProviderUsernames(provider: string, usernames: string[]): Promise<{ user: User; providerUserId: string }[]> {
    if (usernames.length === 0) return [];

    const rows = await this.db
      .selectFrom("users")
      .innerJoin("user_identities", "user_identities.user_id", "users.id")
      .select([
        "users.id",
        "users.created_at",
        "users.updated_at",
        "user_identities.provider_user_id",
      ])
      .where("user_identities.provider", "=", provider as any)
      .where("user_identities.provider_username", "in", usernames)
      .execute();

    return rows.map((row) => ({
      user: {
        id: row.id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      providerUserId: row.provider_user_id,
    }));
  }

  async findTargetIdentities(
    sourceProvider: string,
    sourceUsernames: string[],
    targetPlatform: string,
  ): Promise<{ sourceUsername: string; targetUserId: string }[]> {
    if (sourceUsernames.length === 0) return [];

    const rows = await this.db
      .selectFrom("user_identities as source")
      .innerJoin("user_identities as target", "target.user_id", "source.user_id")
      .select([
        "source.provider_username as source_username",
        "target.provider_user_id as target_user_id",
      ])
      .where("source.provider", "=", sourceProvider as any)
      .where("source.provider_username", "in", sourceUsernames)
      .where("target.provider", "=", targetPlatform as any)
      .execute();

    return rows
      .filter((r) => r.source_username !== null)
      .map((r) => ({
        sourceUsername: r.source_username!,
        targetUserId: r.target_user_id,
      }));
  }
}
