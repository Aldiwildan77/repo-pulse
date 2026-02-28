import type { UserIdentity } from "../../core/entities/index.js";
import type { UserIdentityRow } from "../../infrastructure/database/types.js";

export function toUserIdentity(row: UserIdentityRow): UserIdentity {
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
  };
}
