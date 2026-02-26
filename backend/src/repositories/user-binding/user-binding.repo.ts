import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { UserBindingRepository } from "../../core/repositories/user-binding.repository.js";
import type { UserBinding } from "../../core/entities/index.js";
import { toUserBinding } from "./dto.js";

export class KyselyUserBindingRepository implements UserBindingRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async upsert(data: {
    providerUserId: string;
    providerUsername: string;
    discordUserId?: string | null;
    slackUserId?: string | null;
  }): Promise<UserBinding> {
    const row = await this.db
      .insertInto("user_bindings")
      .values({
        provider_user_id: data.providerUserId,
        provider_username: data.providerUsername,
        discord_user_id: data.discordUserId ?? null,
        slack_user_id: data.slackUserId ?? null,
      })
      .onConflict((oc) =>
        oc.column("provider_user_id").doUpdateSet({
          provider_username: data.providerUsername,
          updated_at: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    return toUserBinding(row);
  }

  async findByProviderUserId(providerUserId: string): Promise<UserBinding | null> {
    const row = await this.db
      .selectFrom("user_bindings")
      .selectAll()
      .where("provider_user_id", "=", providerUserId)
      .executeTakeFirst();

    return row ? toUserBinding(row) : null;
  }

  async findByProviderUsernames(usernames: string[]): Promise<UserBinding[]> {
    if (usernames.length === 0) return [];

    const rows = await this.db
      .selectFrom("user_bindings")
      .selectAll()
      .where("provider_username", "in", usernames)
      .execute();

    return rows.map(toUserBinding);
  }

  async updateDiscord(providerUserId: string, discordUserId: string): Promise<void> {
    await this.db
      .updateTable("user_bindings")
      .set({ discord_user_id: discordUserId, updated_at: new Date() })
      .where("provider_user_id", "=", providerUserId)
      .execute();
  }

  async updateSlack(providerUserId: string, slackUserId: string): Promise<void> {
    await this.db
      .updateTable("user_bindings")
      .set({ slack_user_id: slackUserId, updated_at: new Date() })
      .where("provider_user_id", "=", providerUserId)
      .execute();
  }
}
