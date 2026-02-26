import type { UserBinding } from "../../core/entities/index.js";
import type { UserBindingRow } from "../../infrastructure/database/types.js";

export function toUserBinding(row: UserBindingRow): UserBinding {
  return {
    id: row.id,
    providerUserId: row.provider_user_id,
    providerUsername: row.provider_username,
    discordUserId: row.discord_user_id,
    slackUserId: row.slack_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
