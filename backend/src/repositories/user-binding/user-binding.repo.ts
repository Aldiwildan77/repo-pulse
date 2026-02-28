import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { UserBindingRepository } from "../../core/repositories/user-binding.repository.js";
import type { UserBinding } from "../../core/entities/index.js";
import { toUserBinding } from "./dto.js";

export class KyselyUserBindingRepository implements UserBindingRepository {
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

  async findById(id: number): Promise<UserBinding | null> {
    const row = await this.db
      .selectFrom("user_bindings")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return row ? toUserBinding(row) : null;
  }

  async findByProviderUsernames(provider: string, usernames: string[]): Promise<UserBinding[]> {
    if (usernames.length === 0) return [];

    const rows = await this.db
      .selectFrom("user_bindings")
      .innerJoin("user_identities", "user_identities.user_id", "user_bindings.id")
      .selectAll("user_bindings")
      .where("user_identities.provider", "=", provider)
      .where("user_identities.provider_username", "in", usernames)
      .execute();

    return rows.map(toUserBinding);
  }

  async updateDiscord(userId: number, discordUserId: string): Promise<void> {
    await this.db
      .updateTable("user_bindings")
      .set({ discord_user_id: discordUserId, updated_at: new Date() })
      .where("id", "=", userId)
      .execute();
  }

  async updateSlack(userId: number, slackUserId: string): Promise<void> {
    await this.db
      .updateTable("user_bindings")
      .set({ slack_user_id: slackUserId, updated_at: new Date() })
      .where("id", "=", userId)
      .execute();
  }
}
