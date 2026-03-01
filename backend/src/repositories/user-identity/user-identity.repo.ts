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
      .where("provider", "=", provider as any)
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
    accessTokenEncrypted?: string | null;
    refreshTokenEncrypted?: string | null;
    tokenExpiresAt?: Date | null;
  }): Promise<UserIdentity> {
    const row = await this.db
      .insertInto("user_identities")
      .values({
        user_id: data.userId,
        provider: data.provider as any,
        provider_user_id: data.providerUserId,
        provider_email: data.providerEmail ?? null,
        provider_username: data.providerUsername ?? null,
        access_token_encrypted: data.accessTokenEncrypted ?? null,
        refresh_token_encrypted: data.refreshTokenEncrypted ?? null,
        token_expires_at: data.tokenExpiresAt ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toUserIdentity(row);
  }

  async updateTokens(id: number, accessToken: string, refreshToken: string | null, tokenExpiresAt: Date | null): Promise<void> {
    await this.db
      .updateTable("user_identities")
      .set({
        access_token_encrypted: accessToken,
        refresh_token_encrypted: refreshToken,
        token_expires_at: tokenExpiresAt,
        updated_at: new Date(),
      })
      .where("id", "=", id)
      .execute();
  }
}
