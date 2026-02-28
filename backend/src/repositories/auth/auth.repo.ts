import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { UserBinding } from "../../core/entities/index.js";
import type { UserIdentity } from "../../core/entities/index.js";
import { toUserBinding } from "./dto.js";

function toUserIdentity(row: { id: number; user_id: number; provider: string; provider_user_id: string; provider_email: string | null; provider_username: string | null; created_at: Date }): UserIdentity {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerUserId: row.provider_user_id,
    providerEmail: row.provider_email,
    providerUsername: row.provider_username,
    createdAt: row.created_at,
  };
}

export class KyselyAuthRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async createUser(): Promise<UserBinding> {
    const row = await this.db
      .insertInto("user_bindings")
      .values({
        provider_user_id: null,
        provider_username: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toUserBinding(row);
  }

  async findUserById(id: number): Promise<UserBinding | null> {
    const row = await this.db
      .selectFrom("user_bindings")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return row ? toUserBinding(row) : null;
  }

  async findUserByIdentity(provider: string, providerUserId: string): Promise<UserBinding | null> {
    const row = await this.db
      .selectFrom("user_bindings")
      .innerJoin("user_identities", "user_identities.user_id", "user_bindings.id")
      .selectAll("user_bindings")
      .where("user_identities.provider", "=", provider)
      .where("user_identities.provider_user_id", "=", providerUserId)
      .executeTakeFirst();

    return row ? toUserBinding(row) : null;
  }

  async findIdentity(provider: string, providerUserId: string): Promise<UserIdentity | null> {
    const row = await this.db
      .selectFrom("user_identities")
      .selectAll()
      .where("provider", "=", provider)
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

  async bindDiscord(userId: number, discordUserId: string): Promise<void> {
    await this.db
      .updateTable("user_bindings")
      .set({ discord_user_id: discordUserId, updated_at: new Date() })
      .where("id", "=", userId)
      .execute();
  }

  async bindSlack(userId: number, slackUserId: string): Promise<void> {
    await this.db
      .updateTable("user_bindings")
      .set({ slack_user_id: slackUserId, updated_at: new Date() })
      .where("id", "=", userId)
      .execute();
  }
}
