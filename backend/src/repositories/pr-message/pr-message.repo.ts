import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { PrMessageRepository } from "../../core/repositories/pr-message.repository.js";
import type { Platform, PrMessage, PrStatus } from "../../core/entities/index.js";
import { toPrMessage } from "./dto.js";

export class KyselyPrMessageRepository implements PrMessageRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async create(data: {
    providerPrId: number;
    providerRepo: string;
    platform: Platform;
    platformMessageId: string;
    platformChannelId: string;
  }): Promise<PrMessage> {
    const row = await this.db
      .insertInto("pr_messages")
      .values({
        provider_pr_id: data.providerPrId,
        provider_repo: data.providerRepo,
        platform: data.platform,
        platform_message_id: data.platformMessageId,
        platform_channel_id: data.platformChannelId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toPrMessage(row);
  }

  async findByPrAndRepo(providerPrId: number, providerRepo: string): Promise<PrMessage[]> {
    const rows = await this.db
      .selectFrom("pr_messages")
      .selectAll()
      .where("provider_pr_id", "=", providerPrId)
      .where("provider_repo", "=", providerRepo)
      .execute();

    return rows.map(toPrMessage);
  }

  async updateStatus(id: number, status: PrStatus): Promise<void> {
    await this.db
      .updateTable("pr_messages")
      .set({ status, updated_at: new Date() })
      .where("id", "=", id)
      .execute();
  }
}
