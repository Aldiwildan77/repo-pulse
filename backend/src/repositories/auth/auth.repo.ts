import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { UserBinding } from "../../core/entities/index.js";
import { toUserBinding } from "./dto.js";

export class KyselyAuthRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findOrCreateByProvider(providerUserId: string, providerUsername: string): Promise<UserBinding> {
    const row = await this.db
      .insertInto("user_bindings")
      .values({
        provider_user_id: providerUserId,
        provider_username: providerUsername,
      })
      .onConflict((oc) =>
        oc.column("provider_user_id").doUpdateSet({
          provider_username: providerUsername,
          updated_at: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    return toUserBinding(row);
  }

  async bindDiscord(providerUserId: string, discordUserId: string): Promise<void> {
    await this.db
      .updateTable("user_bindings")
      .set({ discord_user_id: discordUserId, updated_at: new Date() })
      .where("provider_user_id", "=", providerUserId)
      .execute();
  }

  async bindSlack(providerUserId: string, slackUserId: string): Promise<void> {
    await this.db
      .updateTable("user_bindings")
      .set({ slack_user_id: slackUserId, updated_at: new Date() })
      .where("provider_user_id", "=", providerUserId)
      .execute();
  }

  async findByProviderUserId(providerUserId: string): Promise<UserBinding | null> {
    const row = await this.db
      .selectFrom("user_bindings")
      .selectAll()
      .where("provider_user_id", "=", providerUserId)
      .executeTakeFirst();

    return row ? toUserBinding(row) : null;
  }
}
