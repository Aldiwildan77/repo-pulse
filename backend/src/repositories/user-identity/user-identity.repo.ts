import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { UserIdentityRepository } from "../../core/repositories/user-identity.repository.js";
import type { UserIdentity } from "../../core/entities/index.js";
import { toUserIdentity } from "./dto.js";

export class KyselyUserIdentityRepository implements UserIdentityRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findByProvider(provider: string, providerUserId: string): Promise<UserIdentity | null> {
    const row = await this.db
      .selectFrom("user_identities")
      .selectAll()
      .where("provider", "=", provider)
      .where("provider_user_id", "=", providerUserId)
      .executeTakeFirst();

    return row ? toUserIdentity(row) : null;
  }

  async findByUserId(userId: number): Promise<UserIdentity[]> {
    const rows = await this.db
      .selectFrom("user_identities")
      .selectAll()
      .where("user_id", "=", userId)
      .execute();

    return rows.map(toUserIdentity);
  }

  async create(data: {
    userId: number;
    provider: string;
    providerUserId: string;
    providerEmail?: string | null;
    providerUsername?: string | null;
  }): Promise<UserIdentity> {
    const row = await this.db
      .insertInto("user_identities")
      .values({
        user_id: data.userId,
        provider: data.provider,
        provider_user_id: data.providerUserId,
        provider_email: data.providerEmail ?? null,
        provider_username: data.providerUsername ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toUserIdentity(row);
  }
}
