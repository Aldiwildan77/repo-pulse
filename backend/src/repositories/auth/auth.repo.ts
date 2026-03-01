import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { User } from "../../core/entities/index.js";
import type { UserIdentity } from "../../core/entities/index.js";
import { toUser } from "./dto.js";

function toUserIdentity(row: {
  id: number;
  user_id: number;
  provider: string;
  provider_user_id: string;
  provider_email: string | null;
  provider_username: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}): UserIdentity {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerUserId: row.provider_user_id,
    providerEmail: row.provider_email,
    providerUsername: row.provider_username,
    accessTokenEncrypted: row.access_token_encrypted,
    refreshTokenEncrypted: row.refresh_token_encrypted,
    tokenExpiresAt: row.token_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class KyselyAuthRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async createUser(): Promise<User> {
    const row = await this.db
      .insertInto("users")
      .defaultValues()
      .returningAll()
      .executeTakeFirstOrThrow();

    return toUser(row);
  }

  async findUserById(id: number): Promise<User | null> {
    const row = await this.db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return row ? toUser(row) : null;
  }

  async findUserByIdentity(provider: string, providerUserId: string): Promise<User | null> {
    const row = await this.db
      .selectFrom("users")
      .innerJoin("user_identities", "user_identities.user_id", "users.id")
      .selectAll("users")
      .where("user_identities.provider", "=", provider as any)
      .where("user_identities.provider_user_id", "=", providerUserId)
      .executeTakeFirst();

    return row ? toUser(row) : null;
  }

  async findIdentity(provider: string, providerUserId: string): Promise<UserIdentity | null> {
    const row = await this.db
      .selectFrom("user_identities")
      .selectAll()
      .where("provider", "=", provider as any)
      .where("provider_user_id", "=", providerUserId)
      .executeTakeFirst();

    return row ? toUserIdentity(row) : null;
  }

  async findIdentitiesByUserId(userId: number): Promise<UserIdentity[]> {
    const rows = await this.db
      .selectFrom("user_identities")
      .selectAll()
      .where("user_id", "=", userId)
      .execute();

    return rows.map(toUserIdentity);
  }

  async addIdentity(data: {
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

  async updateIdentityTokens(
    identityId: number,
    accessTokenEncrypted: string,
    refreshTokenEncrypted: string | null,
    tokenExpiresAt: Date | null,
  ): Promise<void> {
    await this.db
      .updateTable("user_identities")
      .set({
        access_token_encrypted: accessTokenEncrypted,
        refresh_token_encrypted: refreshTokenEncrypted,
        token_expires_at: tokenExpiresAt,
        updated_at: new Date(),
      })
      .where("id", "=", identityId)
      .execute();
  }

  async findIdentityByUserId(userId: number, provider: string): Promise<UserIdentity | null> {
    const row = await this.db
      .selectFrom("user_identities")
      .selectAll()
      .where("user_id", "=", userId)
      .where("provider", "=", provider as any)
      .executeTakeFirst();

    return row ? toUserIdentity(row) : null;
  }
}
