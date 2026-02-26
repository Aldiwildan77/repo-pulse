import type { PrMessage } from "../../core/entities/index.js";
import type { PrMessageRow } from "../../infrastructure/database/types.js";

export function toPrMessage(row: PrMessageRow): PrMessage {
  return {
    id: row.id,
    providerPrId: row.provider_pr_id,
    providerRepo: row.provider_repo,
    platform: row.platform,
    platformMessageId: row.platform_message_id,
    platformChannelId: row.platform_channel_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
